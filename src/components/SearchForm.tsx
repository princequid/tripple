import { Icon } from './Icon';

/**
 * C09 SearchBar. A plain GET form to `/search?q=`, which 308-redirects to the canonical `/search/:term`
 * (BR-38), so it works without JavaScript.
 */
export function SearchForm({ variant, id, defaultValue }: { variant: 'header' | 'hero'; id: string; defaultValue?: string }) {
  const hero = variant === 'hero';
  return (
    <form className={`ui-search ${hero ? 'ui-search--hero' : 'ui-header__search'}`} role="search" action="/search" method="get">
      <Icon name="search" className="ui-search__icon" />
      <label className="visually-hidden" htmlFor={id}>
        Search shots
      </label>
      <input
        id={id}
        name="q"
        className={`ui-input neu-field${hero ? ' ui-input--lg' : ''}`}
        type="search"
        placeholder={hero ? 'What are you looking for?' : 'Search shots'}
        defaultValue={defaultValue}
        maxLength={100}
        autoComplete="off"
      />
      {hero && (
        <button className="ui-btn ui-btn--primary ui-search__submit" type="submit">
          Search
        </button>
      )}
    </form>
  );
}
