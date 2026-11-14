import type { FormEvent, InputHTMLAttributes } from 'react'
import searchIcon from '@/assets/icons/search-coral.svg'
import styles from './SearchBar.module.scss'

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onSubmit'> {
  value: string
  onValueChange: (value: string) => void
  onSearch: (keyword: string) => void
  'aria-label': string
}

function SearchBar({
  value,
  onValueChange,
  onSearch,
  className,
  'aria-label': ariaLabel,
  ...inputProps
}: SearchBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const keyword = value.trim()
    if (keyword) onSearch(keyword)
  }

  return (
    <form role="search" className={[styles.bar, className].filter(Boolean).join(' ')} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-label={ariaLabel}
        enterKeyHint="search"
        autoComplete="off"
        {...inputProps}
      />
      <button type="submit" className={styles.submit} aria-label="검색">
        <img src={searchIcon} alt="" />
      </button>
    </form>
  )
}

export default SearchBar
