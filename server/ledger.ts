import { db } from './db.ts'
import { round2 } from './pricing.ts'

/**
 * Keeper's Ledger — the platform's double-entry book.
 *
 * Accounts:
 *   customer_funds   money held from buyers (escrow) or owed to buyers
 *   escrow_held      buyer funds held until proof of delivery
 *   revenue          platform commission and service fees
 *   delivery_costs   amounts payable to delivery partners
 *   seller_payable   amounts owed to shops
 *   platform_cash    platform cash position
 *
 * Every order posts a balanced set of entries: the total debits must equal
 * the total credits, per order, always.
 */

export const ACCOUNTS = [
  'platform_cash',
  'escrow_held',
  'revenue',
  'delivery_costs',
  'seller_payable',
] as const

export type Account = (typeof ACCOUNTS)[number]

export interface LedgerRow {
  id: number
  ts: string
  order_id: number | null
  account: string
  direction: 'debit' | 'credit'
  amount_pula: number
  kind: string
  memo: string
}

export function post(entries: Omit<LedgerRow, 'id'>[]): void {
  const debit = round2(entries.filter((e) => e.direction === 'debit').reduce((s, e) => s + e.amount_pula, 0))
  const credit = round2(entries.filter((e) => e.direction === 'credit').reduce((s, e) => s + e.amount_pula, 0))
  if (Math.abs(debit - credit) > 0.01) {
    throw new Error(`Ledger would not balance: debits ${debit} vs credits ${credit}`)
  }
  const stmt = db.prepare(
    `INSERT INTO ledger_entries (ts, order_id, account, direction, amount_pula, kind, memo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
  for (const e of entries) {
    stmt.run(e.ts, e.order_id, e.account, e.direction, round2(e.amount_pula), e.kind, e.memo)
  }
}

export interface AccountBalance {
  account: string
  debit: number
  credit: number
  balance: number
}

export function balances(): AccountBalance[] {
  const rows = db
    .prepare(
      `SELECT account,
              SUM(CASE WHEN direction='debit' THEN amount_pula ELSE 0 END) AS debit,
              SUM(CASE WHEN direction='credit' THEN amount_pula ELSE 0 END) AS credit
       FROM ledger_entries GROUP BY account`,
    )
    .all() as { account: string; debit: number; credit: number }[]

  const map = new Map(rows.map((r) => [r.account, r]))
  return ACCOUNTS.map((account) => {
    const r = map.get(account)
    const debit = round2(r?.debit ?? 0)
    const credit = round2(r?.credit ?? 0)
    return { account, debit, credit, balance: round2(debit - credit) }
  })
}

export function entriesForOrder(orderId: number): LedgerRow[] {
  return db
    .prepare(`SELECT * FROM ledger_entries WHERE order_id = ? ORDER BY id`)
    .all(orderId) as unknown as LedgerRow[]
}

export function recentEntries(limit = 40): LedgerRow[] {
  return db
    .prepare(`SELECT * FROM ledger_entries ORDER BY id DESC LIMIT ?`)
    .all(limit) as unknown as LedgerRow[]
}
