import React, { useMemo, useState } from 'react'

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return NaN
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

function formatNumber(n, digits = 4) {
  if (!Number.isFinite(n)) return '-'
  const factor = Math.pow(10, digits)
  return (Math.round((n + Number.EPSILON) * factor) / factor).toFixed(digits)
}

function percentToFactor(percentNumber) {
  return percentNumber / 100
}

function formatPercent(n, digits = 2) {
  if (!Number.isFinite(n)) return '-'
  const value = n * 100
  const factor = Math.pow(10, digits)
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor
  return `${rounded.toFixed(digits)}%`
}

function calculateMetrics(P, L, Tpercent, Dpercent, R1percent, R2percent) {
  const Pn = toNumber(P)
  const Ln = toNumber(L)
  const Tn = toNumber(Tpercent)
  const Dn = toNumber(Dpercent)
  const R1n = toNumber(R1percent)
  const R2n = toNumber(R2percent)

  if ([Pn, Ln, Tn, Dn, R1n, R2n].some((v) => !Number.isFinite(v))) return null

  const T = percentToFactor(Tn)
  const D = percentToFactor(Dn)
  const R1 = percentToFactor(R1n)
  const R2 = percentToFactor(R2n)

  const oneMinusT = 1 - T
  const oneMinusD = 1 - D
  const productP = Pn * oneMinusT
  const pre = productP - Ln
  const GP = pre * oneMinusD
  const GP1 = GP * R1
  const GP2 = GP * R2
  const NP = GP - GP1 - GP2
  const GPR = Pn !== 0 ? GP / Pn : NaN
  return { GP, GP1, GP2, NP, GPR }
}

export default function App() {
  const [inputs, setInputs] = useState({
    P: '',
    L: '',
    T: '',
    D: '',
    R1: '',
    R2: '',
  })

  const [errors, setErrors] = useState({})
  const [clicked, setClicked] = useState(false)

  // Table state (rows can be edited)
  const [tableRows, setTableRows] = useState([
    { id: 1, P: '', L: '', T: '', D: '', R1: '', R2: '' },
  ])
  const [tableClicked, setTableClicked] = useState(false)

  const handleChange = (key) => (e) => {
    const value = e.target.value
    setInputs((prev) => ({ ...prev, [key]: value }))
    if (clicked) {
      setErrors(validate({ ...inputs, [key]: value }))
    }
  }

  function validate(values) {
    const nextErrors = {}
    const P = toNumber(values.P)
    const L = toNumber(values.L)
    const T = toNumber(values.T)
    const D = toNumber(values.D)
    const R1 = toNumber(values.R1)
    const R2 = toNumber(values.R2)

    if (!Number.isFinite(P) || P < 0) nextErrors.P = '请输入有效的中标价 (≥ 0)'
    if (!Number.isFinite(L) || L < 0) nextErrors.L = '请输入有效的底价 (≥ 0)'
    if (!Number.isFinite(T) || T < 0 || T > 100) nextErrors.T = '费用应在 0% ~ 100%'
    if (!Number.isFinite(D) || D < 0 || D > 100) nextErrors.D = '配送费率应在 0% ~ 100%'
    if (!Number.isFinite(R1) || R1 < 0 || R1 > 100) nextErrors.R1 = '利润分配比例1应在 0% ~ 100%'
    if (!Number.isFinite(R2) || R2 < 0 || R2 > 100) nextErrors.R2 = '利润分配比例2应在 0% ~ 100%'
    if (Number.isFinite(P) && Number.isFinite(L) && P < L) {
      nextErrors.P = '中标价应 ≥ 底价'
    }
    return nextErrors
  }

  const [results, steps] = useMemo(() => {
    const P = toNumber(inputs.P)
    const L = toNumber(inputs.L)
    const Tpercent = toNumber(inputs.T)
    const Dpercent = toNumber(inputs.D)
    const R1percent = toNumber(inputs.R1)
    const R2percent = toNumber(inputs.R2)

    if ([P, L, Tpercent, Dpercent, R1percent, R2percent].some((v) => !Number.isFinite(v))) {
      return [null, []]
    }

    const T = percentToFactor(Tpercent)
    const D = percentToFactor(Dpercent)
    const R1 = percentToFactor(R1percent)
    const R2 = percentToFactor(R2percent)

    const oneMinusT = 1 - T
    const oneMinusD = 1 - D
    const productP = P * oneMinusT
    const pre = productP - L
    const GP = pre * oneMinusD
    const GP1 = GP * R1
    const GP2 = GP * R2
    const NP = GP - GP1 - GP2

    const stepsText = []
    // 毛利（GP）计算分步展示
    stepsText.push('毛利 = (中标价 × (1 - 费用) - 底价) × (1 - 配送费率)')
    stepsText.push(`     = (${formatNumber(P)} × (1 - ${formatNumber(Tpercent, 2)}%) - ${formatNumber(L)}) × (1 - ${formatNumber(Dpercent, 2)}%)`)
    stepsText.push(`     = (${formatNumber(P)} × ${formatNumber(oneMinusT)} - ${formatNumber(L)}) × ${formatNumber(oneMinusD)}`)
    stepsText.push(`     = (${formatNumber(productP)} - ${formatNumber(L)}) × ${formatNumber(oneMinusD)}`)
    stepsText.push(`     = ${formatNumber(pre)} × ${formatNumber(oneMinusD)}`)
    stepsText.push(`     = ${formatNumber(GP)}`)

    stepsText.push('')
    stepsText.push('毛利分配1 = 毛利 × 利润分配比例1')
    stepsText.push(`        = ${formatNumber(GP)} × ${formatNumber(R1percent, 2)}%`)
    stepsText.push(`        = ${formatNumber(GP1)}`)

    stepsText.push('')
    stepsText.push('毛利分配2 = 毛利 × 利润分配比例2')
    stepsText.push(`        = ${formatNumber(GP)} × ${formatNumber(R2percent, 2)}%`)
    stepsText.push(`        = ${formatNumber(GP2)}`)

    stepsText.push('')
    stepsText.push('净利 = 毛利 - 毛利分配1 - 毛利分配2')
    stepsText.push(`    = ${formatNumber(GP)} - ${formatNumber(GP1)} - ${formatNumber(GP2)}`)
    stepsText.push(`    = ${formatNumber(NP)}`)

    // 毛利比
    stepsText.push('')
    stepsText.push('毛利比 = 毛利 / 中标价')
    stepsText.push(`     = ${formatNumber(GP)} / ${formatNumber(P)}`)
    stepsText.push(`     = ${formatPercent(P !== 0 ? GP / P : NaN, 2)}`)

    return [
      { GP, GP1, GP2, NP, GPR: P !== 0 ? GP / P : NaN },
      stepsText,
    ]
  }, [inputs])

  const onCompute = () => {
    setClicked(true)
    const nextErrors = validate(inputs)
    setErrors(nextErrors)
  }

  const onReset = () => {
    setInputs({ P: '', L: '', T: '', D: '', R1: '', R2: '' })
    setErrors({})
    setClicked(false)
  }

  const hasErrors = Object.keys(errors).length > 0

  // Table helpers
  const onAddRow = () => {
    setTableRows((rows) => {
      const nextId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1
      return [...rows, { id: nextId, P: '', L: '', T: '', D: '', R1: '', R2: '' }]
    })
  }

  const onRemoveRow = (id) => {
    setTableRows((rows) => rows.filter((r) => r.id !== id))
  }

  const onRowChange = (id, key, value) => {
    setTableRows((rows) => rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  }

  const onComputeTable = () => {
    setTableClicked(true)
  }

  const tableResults = useMemo(() => {
    if (!tableClicked) return []
    return tableRows.map((row) => calculateMetrics(row.P, row.L, row.T, row.D, row.R1, row.R2))
  }, [tableRows, tableClicked])

  return (
    <div className="app">
      <header>
        <h1>商品利润计算器</h1>
      </header>

      <div className="container">
        <section className="panel">
          <div className="panel-header">
            <h2>输入区域</h2>
            <span className="hint">百分比直接输入数字，例如 5 表示 5%</span>
          </div>

          <div className="grid fields">
            <div className="field">
              <div className="label-row"><label htmlFor="P">中标价</label></div>
              <input id="P" type="number" placeholder="例如 3.00" inputMode="decimal" step="0.0001"
                value={inputs.P} onChange={handleChange('P')} />
              {errors.P ? <div className="error">{errors.P}</div> : null}
            </div>

            <div className="field">
              <div className="label-row"><label htmlFor="L">底价</label></div>
              <input id="L" type="number" placeholder="例如 1.85" inputMode="decimal" step="0.0001"
                value={inputs.L} onChange={handleChange('L')} />
              {errors.L ? <div className="error">{errors.L}</div> : null}
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="T">费用</label>
                <span className="suffix">%</span>
              </div>
              <input id="T" type="number" placeholder="例如 5 (表示 5%)" inputMode="decimal" step="0.01"
                value={inputs.T} onChange={handleChange('T')} />
              {errors.T ? <div className="error">{errors.T}</div> : <div className="hint">0 ~ 100</div>}
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="D">配送费率</label>
                <span className="suffix">%</span>
              </div>
              <input id="D" type="number" placeholder="例如 3 (表示 3%)" inputMode="decimal" step="0.01"
                value={inputs.D} onChange={handleChange('D')} />
              {errors.D ? <div className="error">{errors.D}</div> : <div className="hint">0 ~ 100</div>}
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="R1">利润分配比例1</label>
                <span className="suffix">%</span>
              </div>
              <input id="R1" type="number" placeholder="例如 10 (表示 10%)" inputMode="decimal" step="0.01"
                value={inputs.R1} onChange={handleChange('R1')} />
              {errors.R1 ? <div className="error">{errors.R1}</div> : <div className="hint">0 ~ 100</div>}
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="R2">利润分配比例2</label>
                <span className="suffix">%</span>
              </div>
              <input id="R2" type="number" placeholder="例如 20 (表示 20%)" inputMode="decimal" step="0.01"
                value={inputs.R2} onChange={handleChange('R2')} />
              {errors.R2 ? <div className="error">{errors.R2}</div> : <div className="hint">0 ~ 100</div>}
            </div>
          </div>
          <div className="actions">
            <button className="btn primary" onClick={onCompute}>计算</button>
            <button className="btn secondary" onClick={onReset}>重置</button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>结果与计算过程</h2>
            <span className="hint">点击“计算”后会更新</span>
          </div>

          <div className="result">
              <div className="kpis">
              <div className="kpi">
                <div className="label">毛利</div>
                <div className="value">{results ? formatNumber(results.GP) : '-'}</div>
              </div>
              <div className="kpi">
                <div className="label">毛利分配1</div>
                <div className="value">{results ? formatNumber(results.GP1) : '-'}</div>
              </div>
              <div className="kpi">
                <div className="label">毛利分配2</div>
                <div className="value">{results ? formatNumber(results.GP2) : '-'}</div>
              </div>
              <div className="kpi">
                <div className="label">净利</div>
                <div className="value">{results ? formatNumber(results.NP) : '-'}</div>
              </div>
                <div className="kpi">
                  <div className="label">毛利比</div>
                  <div className="value">{results ? formatPercent(results.GPR, 2) : '-'}</div>
                </div>
            </div>

            <div className="steps">
              {clicked && hasErrors && (
                <div className="error" style={{ padding: '6px 6px 10px' }}>
                  请修正输入后再计算。
                </div>
              )}
              {clicked && !hasErrors ? (
                <pre><code>{steps.join('\n')}</code></pre>
              ) : (
                <pre><code>在左侧输入数值后点击“计算”查看完整计算过程。</code></pre>
              )}
            </div>
          </div>
        </section>

        <section className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-header">
            <h2>批量计算表格</h2>
            <span className="hint">支持增删行与逐行编辑，点击“计算表格”后生成结果列</span>
          </div>
          <div className="grid" style={{ gap: 8, padding: 0 }}>
            <div className="actions" style={{ padding: 0 }}>
              <button className="btn primary" onClick={onComputeTable}>计算表格</button>
              <button className="btn secondary" onClick={onAddRow}>新增一行</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>中标价</th>
                    <th>底价</th>
                    <th>费用(%)</th>
                    <th>配送费率(%)</th>
                    <th>利润分配比例1(%)</th>
                    <th>利润分配比例2(%)</th>
                    {tableClicked && (
                      <>
                        <th>毛利</th>
                        <th>毛利分配1</th>
                        <th>毛利分配2</th>
                        <th>净利</th>
                        <th>毛利比</th>
                      </>
                    )}
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, idx) => {
                    const res = tableClicked ? tableResults[idx] : null
                    return (
                      <tr key={row.id}>
                        <td><input type="number" inputMode="decimal" step="0.0001" value={row.P} onChange={(e) => onRowChange(row.id, 'P', e.target.value)} /></td>
                        <td><input type="number" inputMode="decimal" step="0.0001" value={row.L} onChange={(e) => onRowChange(row.id, 'L', e.target.value)} /></td>
                        <td><input type="number" inputMode="decimal" step="0.01" value={row.T} onChange={(e) => onRowChange(row.id, 'T', e.target.value)} /></td>
                        <td><input type="number" inputMode="decimal" step="0.01" value={row.D} onChange={(e) => onRowChange(row.id, 'D', e.target.value)} /></td>
                        <td><input type="number" inputMode="decimal" step="0.01" value={row.R1} onChange={(e) => onRowChange(row.id, 'R1', e.target.value)} /></td>
                        <td><input type="number" inputMode="decimal" step="0.01" value={row.R2} onChange={(e) => onRowChange(row.id, 'R2', e.target.value)} /></td>
                        {tableClicked && (
                          <>
                            <td>{res ? formatNumber(res.GP) : '-'}</td>
                            <td>{res ? formatNumber(res.GP1) : '-'}</td>
                            <td>{res ? formatNumber(res.GP2) : '-'}</td>
                            <td>{res ? formatNumber(res.NP) : '-'}</td>
                            <td>{res ? formatPercent(res.GPR, 2) : '-'}</td>
                          </>
                        )}
                        <td><button className="btn secondary" onClick={() => onRemoveRow(row.id)}>删除</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <footer>
        ©2025 利润计算器 
      </footer>
    </div>
  )
}

// Inline styles for table headers/cells to match dark theme
const thStyle = {
  position: 'sticky',
  top: 0,
  background: '#0f1523',
  color: '#aab2c5',
  textAlign: 'left',
  padding: '10px 8px',
  borderBottom: '1px solid rgba(255,255,255,0.08)'
}

const tdStyle = {
  padding: '8px',
  borderBottom: '1px solid rgba(255,255,255,0.06)'
}
