import type { FormEvent, InputHTMLAttributes } from 'react'
import searchIcon from '@/assets/icons/search.svg'
import styles from './SearchBar.module.scss'

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onSubmit'> {
  value: string
  onValueChange: (value: string) => void
  // 키보드 검색(Enter)이나 돋보기 버튼으로 검색어를 확정할 때
  onSearch: (keyword: string) => void
  'aria-label': string
}

// 한 줄 검색창 (휴게소 검색 등). 오른쪽 돋보기를 누르거나 Enter로 검색한다
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
