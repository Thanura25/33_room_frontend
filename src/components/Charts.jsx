import { useState } from 'react'
import { formatCurrency } from '../utils/formatters'

export function CategoryExpensesChart({ data = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const maxVal = Math.max(...data.map(d => d.amount || 0), 100)

  const colors = {
    electricity: '#3b82f6',
    water: '#06b6d4',
    telecom: '#8b5cf6',
    restaurant: '#f97316',
    other: '#10b981',
  }

  return (
    <div className="chart-container">
      <div className="chart-bars-wrap">
        {data.map((item, idx) => {
          const heightPercent = Math.max(8, Math.round(((item.amount || 0) / maxVal) * 100))
          const isHovered = hoveredIdx === idx
          return (
            <div
              key={item.category || idx}
              className={`chart-bar-group ${isHovered ? 'is-active' : ''}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHovered && (
                <div className="chart-tooltip">
                  <strong>{item.label || item.category}</strong>
                  <span>{formatCurrency(item.amount)}</span>
                  <small>{item.percentage || 0}% of monthly total</small>
                </div>
              )}
              <div className="chart-bar-track">
                <div
                  className="chart-bar-fill"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: colors[item.code] || '#4f46e5',
                  }}
                />
              </div>
              <span className="chart-bar-label">{item.shortLabel || item.category}</span>
              <span className="chart-bar-val">{formatCurrency(item.amount)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CollectionTrendsChart({ history = [] }) {
  const maxVal = Math.max(...history.flatMap(h => [h.totalBill || 0, h.collected || 0]), 100)

  return (
    <div className="chart-container">
      <div className="chart-legend">
        <div className="legend-item"><span className="legend-dot is-indigo" /> Total Bill</div>
        <div className="legend-item"><span className="legend-dot is-green" /> Collected</div>
      </div>
      <div className="chart-bars-wrap">
        {history.map((item, idx) => {
          const billHeight = Math.max(6, Math.round(((item.totalBill || 0) / maxVal) * 100))
          const collHeight = Math.max(6, Math.round(((item.collected || 0) / maxVal) * 100))
          return (
            <div key={item.month || idx} className="chart-bar-group">
              <div className="chart-bar-track chart-bar-track--dual">
                <div
                  className="chart-bar-fill is-bill"
                  style={{ height: `${billHeight}%` }}
                  title={`Billed: ${formatCurrency(item.totalBill)}`}
                />
                <div
                  className="chart-bar-fill is-collected"
                  style={{ height: `${collHeight}%` }}
                  title={`Collected: ${formatCurrency(item.collected)}`}
                />
              </div>
              <span className="chart-bar-label">{item.monthLabel || item.month}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CategoryDonutChart({ categories = [] }) {
  const total = categories.reduce((sum, c) => sum + (c.amount || 0), 0)
  const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f97316', '#10b981']

  return (
    <div className="category-donut-wrap">
      <div className="category-progress-list">
        {categories.map((cat, idx) => {
          const percent = total > 0 ? Math.round(((cat.amount || 0) / total) * 100) : 0
          return (
            <div key={cat.code || idx} className="cat-progress-item">
              <div className="cat-progress-header">
                <span className="cat-progress-name">
                  <span className="cat-color-badge" style={{ backgroundColor: colors[idx % colors.length] }} />
                  {cat.name}
                </span>
                <span className="cat-progress-val">
                  {formatCurrency(cat.amount || 0)} <strong>({percent}%)</strong>
                </span>
              </div>
              <div className="cat-progress-bar">
                <div
                  className="cat-progress-fill"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: colors[idx % colors.length],
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
