import { describe, it, expect } from 'vitest'
import { assertReadOnly } from './sqlGuard.js'

describe('assertReadOnly', () => {
  it('accepts a plain SELECT', () => {
    expect(assertReadOnly('SELECT * FROM orders')).toBe('SELECT * FROM orders')
  })

  it('accepts a WITH (CTE) query', () => {
    const q = 'WITH x AS (SELECT 1) SELECT * FROM x'
    expect(assertReadOnly(q)).toBe(q)
  })

  it('strips a single trailing semicolon', () => {
    expect(assertReadOnly('SELECT 1;')).toBe('SELECT 1')
  })

  it('rejects INSERT', () => {
    expect(() => assertReadOnly("INSERT INTO orders VALUES (1)")).toThrow(/forbidden|SELECT/i)
  })

  it('rejects DROP', () => {
    expect(() => assertReadOnly('DROP TABLE orders')).toThrow()
  })

  it('rejects UPDATE', () => {
    expect(() => assertReadOnly('UPDATE orders SET status = 1')).toThrow()
  })

  it('rejects multiple statements', () => {
    expect(() => assertReadOnly('SELECT 1; DROP TABLE orders')).toThrow(/Multiple/i)
  })

  it('rejects empty input', () => {
    expect(() => assertReadOnly('   ')).toThrow(/Empty/i)
  })

  it('rejects non-select leading keyword', () => {
    expect(() => assertReadOnly('EXPLAIN SELECT 1')).toThrow()
  })
})
