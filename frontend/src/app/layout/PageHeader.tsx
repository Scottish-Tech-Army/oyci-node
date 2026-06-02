import { useId } from 'react'
import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  roleBadge?: string
  icon?: ReactNode
}

export function PageHeader({ eyebrow, title, description, roleBadge, icon }: PageHeaderProps) {
  const titleId = useId()

  return (
    <section className="page-header" aria-labelledby={titleId}>
      <div className="page-header__content">
        {icon ? (
          <div className="page-header__icon" aria-hidden="true">
            {icon}
          </div>
        ) : null}

        <div className="page-header__copy">
          {eyebrow ? <p className="page-header__eyebrow">{eyebrow}</p> : null}
          <h1 id={titleId}>{title}</h1>
          {description ? <p className="page-header__description">{description}</p> : null}
        </div>
      </div>

      {roleBadge ? (
        <div className="page-header__meta">
          <span className="page-header__badge">{roleBadge}</span>
        </div>
      ) : null}
    </section>
  )
}
