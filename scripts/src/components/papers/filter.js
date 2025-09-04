import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import Dropdown from './dropdown';

// const sort = arr => _.sortBy(arr, ['label', 'count']);

const Filter = ({ edges = [], limit = 10, children = () => null }) => {
  // const [options, setOptions] = useState([]);
  const [authors, setAuthors] = useState({});
  const [years, setYears] = useState([]);
  const [types, setTypes] = useState([]);
  const [showall, setShowall] = useState(false);
  const [hasmore, setHasmore] = useState(edges.length > limit);
  const [filteredPapers, setFilteredPapers] = useState(() =>
    edges.slice(0, limit)
  );
  const [expandedType, setExpanded] = useState('');
  const [facets, setFacets] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [authorSearchText, setAuthorSearchText] = useState('');

  // precalc lists
  useEffect(() => {
    // calc unique author strings
    const authorsList = Array.from(
      new Set(
        edges
          .map(({ node: { data = {} } }) => data.authorName || [])
          .reduce((acc, val) => acc.concat(val), [])
          .filter(Boolean)
      )
    );
    const groupedByFirstLetter = _.groupBy(authorsList, it =>
      it[0].toUpperCase()
    );
    const sortedAuthorsLetters = Object.keys(groupedByFirstLetter)
      .sort((a, b) => a.localeCompare(b))
      .filter(letter => letter.trim().length > 0);
    setAuthors(
      sortedAuthorsLetters
        .map(letter => ({
          [letter]: groupedByFirstLetter[letter].map(author => ({
            author,
            count: edges.filter(({ node: { data = {} } }) =>
              (data.authorName || []).includes(author)
            ).length,
          })),
        }))
        .reduce((acc, val) => Object.assign(acc, val), {})
    );

    // get years list
    const yearsList = Array.from(
      new Set(
        edges.map(it => Number(it.node?.data?.year)).filter(Number.isFinite)
      )
    );
    const yearsWithCount = yearsList
      .sort((a, b) => b - a)
      .map(year => ({
        year,
        count: edges.filter(item => Number(item.node?.data?.year) === year)
          .length,
      }));
    setYears(yearsWithCount);

    // calc authors for autosuggest
    const typesList = Array.from(
      new Set(edges.map(it => it.node?.data?.publicationType).filter(Boolean))
    );
    const typesWithCount = typesList.map(type => ({
      type,
      count: edges.filter(item => item.node?.data?.publicationType === type)
        .length,
    }));
    setTypes(typesWithCount);
  }, [edges]);

  useEffect(() => {
    const newFilteredPapers = edges
      .filter(
        ({ node: { data } }) =>
          (data?.title || '').toLowerCase().includes(searchText) ||
          data?.authorName?.some(name =>
            name.toLowerCase().includes(searchText)
          )
      )
      .filter(({ node: { data } }) =>
        facets.every(facet => {
          if (facet.type === 'author') {
            return (data?.authorName || []).indexOf(facet.data) !== -1;
          }
          if (facet.type === 'year') {
            return Number(data?.year) === Number(facet.data);
          }
          if (facet.type === 'type') {
            return data?.publicationType === facet.data;
          }
          return false;
        })
      )
      .sort(
        (a, b) =>
          (Number(b.node?.data?.year) || 0) - (Number(a.node?.data?.year) || 0)
      );

    const slicedPapers = showall
      ? newFilteredPapers
      : newFilteredPapers.slice(0, limit);

    setHasmore(newFilteredPapers.length > slicedPapers.length);
    setFilteredPapers(slicedPapers);
  }, [edges, facets, searchText, showall, limit]);

  const search = text => {
    setSearchText(text.trim().toLowerCase());
    setShowall(false);
  };

  const filterYear = year => {
    const newFacets = facets.concat({ type: 'year', data: year });
    setFacets(newFacets);
    setExpanded('');
    setShowall(false);
  };

  const filterAuthor = author => {
    const newFacets = facets.concat({ type: 'author', data: author });
    setFacets(newFacets);
    setExpanded('');
    setAuthorSearchText('');
    setShowall(false);
  };

  const filterType = type => {
    const newFacets = facets.concat({ type: 'type', data: type });
    setFacets(newFacets);
    setExpanded('');
    setShowall(false);
  };

  const removeFacet = facet => {
    const newFacets = facets.filter(f => f !== facet);
    setFacets(newFacets);
  };

  const handleAuthorSearch = txt => {
    setAuthorSearchText(txt.toLowerCase());
  };

  return (
    <>
      <div className="no-js-only">{children(edges)}</div>
      <div className="js-only">
        <input
          aria-label="Search publications"
          type="text"
          className="input papers-filter"
          placeholder="Search by article or author name"
          value={searchText}
          onChange={e => search(e.target.value)}
        />

        <div className="facets">
          {facets.map(facet => (
            <div className="selected-facet" key={`${facet.type}:${facet.data}`}>
              <span className="facet-name">{facet.data}</span>
              <button
                aria-label={`Remove filter ${facet.type}:${facet.data}`}
                type="button"
                className="delete-icon"
                onClick={() => removeFacet(facet)}
              />
            </div>
          ))}
        </div>

        <ul className="papers-facets">
          <li>
            <Dropdown
              onClick={() =>
                expandedType === 'authors'
                  ? setExpanded('')
                  : setExpanded('authors')
              }
              title="Authors"
              isExpanded={expandedType === 'authors'}
              facets={
                <>
                  <input
                    aria-label="Search authors"
                    type="text"
                    placeholder="Search by name"
                    className="input"
                    onChange={e => handleAuthorSearch(e.target.value)}
                  />

                  {Object.keys(authors)
                    .filter(letter =>
                      authors[letter].some(({ author }) =>
                        author.toLowerCase().includes(authorSearchText)
                      )
                    )
                    .map(letter => (
                      <div className="facet-group" key={letter}>
                        <h4 className="facet-header">{letter}</h4>
                        {authors[letter]
                          .filter(({ author }) =>
                            author.toLowerCase().includes(authorSearchText)
                          )
                          .map(({ author, count }) => (
                            <div
                              className="facet"
                              key={author}
                              onClick={() => filterAuthor(author)}
                            >
                              <div className="facet-text">{author}</div>{' '}
                              <div className="count">{count}</div>
                            </div>
                          ))}
                      </div>
                    ))}
                </>
              }
            />
          </li>
          <li>
            <Dropdown
              onClick={() =>
                expandedType === 'years'
                  ? setExpanded('')
                  : setExpanded('years')
              }
              title="Years"
              isExpanded={expandedType === 'years'}
              facets={
                <>
                  {years
                    .filter(
                      ({ year }) =>
                        !facets.find(f => f.type === 'year' && f.data === year)
                    )
                    .map(({ year, count }) => (
                      <div
                        className="facet"
                        onClick={() => filterYear(year)}
                        key={year}
                      >
                        <div className="facet-text">{year}</div>{' '}
                        <div className="count">{count}</div>
                      </div>
                    ))}
                </>
              }
            />
          </li>
          <li>
            <Dropdown
              onClick={() =>
                expandedType === 'type' ? setExpanded('') : setExpanded('type')
              }
              title="Type"
              isExpanded={expandedType === 'type'}
              facets={
                <>
                  {types
                    .filter(
                      ({ type }) =>
                        !facets.find(f => f.type === 'type' && f.data === type)
                    )
                    .map(({ type, count }) => (
                      <div
                        className="facet"
                        onClick={() => filterType(type)}
                        key={type}
                      >
                        <div className="facet-text">{type}</div>{' '}
                        <div className="count">{count}</div>
                      </div>
                    ))}
                </>
              }
            />
          </li>
        </ul>

        {children(filteredPapers)}
        {!showall && hasmore && (
          <div className="flex justify-center">
            <button
              className="button is-link action-button"
              onClick={() => setShowall(true)}
            >
              Load all <FaChevronDown style={{ marginLeft: 10 }} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Filter;
