import React, { useEffect, useState } from 'react';

export default ({ edges, children = () => {} }) => {
  const [autocompleteValues, setAutocompleteValues] = useState([]);
  const [facets, setFacets] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredPapers, setFilteredPapers] = useState([]);

  useEffect(() => {
    // precalc autocompleteItems
    const autocompleteAuthors = Array.from(
      new Set(
        edges
          .map(({ node: { data } }) => data.authorName || [])
          .reduce((acc, val) => acc.concat(val), [])
      )
    ).map(a => ({
      type: 'author',
      data: a,
      count: edges.filter(({ node: { data } }) =>
        (data.authorName || []).includes(a)
      ).length,
    }));
    const autocompleteYears = Array.from(
      new Set(edges.map(it => it.node.data.year))
    ).map(it => ({
      type: 'year',
      data: it,
      count: edges.filter(item => item.node.data.year === it).length,
    }));
    const autocompleteTypes = Array.from(
      new Set(edges.map(it => it.node.data.type))
    ).map(it => ({
      type: 'type',
      data: it,
      count: edges.filter(item => item.node.data.type === it).length,
    }));
    const res = autocompleteAuthors
      .concat(autocompleteYears)
      .concat(autocompleteTypes)
      .reduce((acc, val) => acc.concat(val), []);
    setAutocompleteValues(res);
  }, [edges]);

  useEffect(() => {
    const newFilteredPapers = edges
      .filter(({ node: { data } }) =>
        data.title.toLowerCase().includes(searchKeyword.toLowerCase())
      )
      .filter(({ node: { data } }) =>
        facets.every(facet => {
          if (facet.type === 'author') {
            return (
              data.authorName && data.authorName.indexOf(facet.data) !== -1
            );
          }
          if (facet.type === 'year') {
            return data.year === facet.data;
          }
          if (facet.type === 'type') {
            return data.type === facet.data;
          }
          return false;
        })
      );

    setFilteredPapers(newFilteredPapers);
  }, [facets, searchKeyword]);

  const removeFacet = facet => {
    const newFacets = facets.filter(f => f.data !== facet.data);
    setFacets(newFacets);
  };

  const addFacet = facet => {
    const newFacets = facets.concat([facet]);
    setFacets(newFacets);
  };

  const handleChange = e => {
    const { value } = e.target;
    setSearchKeyword(value);
  };

  return (
    <>
      <style jsx>
        {`
          .tag {
            margin-left: 5px;
          }

          .facets {
            margin-top: 10px;
            margin-bottom: 10px;
          }

          .autocomplete {
            position: fixed;
            z-index: 1000;
            background: #fff;
            width: 99%;
            border: 1px solid black;
          }

          .box {
            margin-top: 10px;
            height: 200px;
            overflow: auto;
          }

          .filter-item {
            margin-top: 5px;
            cursor: pointer;
          }

          .search-input {
            margin-top: 5px;
            margin-bottom: 10px;
          }

          .tag-count {
            width: 30px;
          }
        `}
      </style>

      <strong>Keyword</strong>
      <input
        type="text"
        className="input search-input"
        value={searchKeyword}
        onChange={handleChange}
      />

      <div className="columns">
        <div className="column">
          <strong>Year</strong>
          <div className="box">
            {facets
              .filter(f => f.type === 'year')
              .map(f => (
                <div key={f.data} className="control">
                  <div className="tags has-addons">
                    <a className="tag is-link">{f.data}</a>
                    <a
                      className="tag is-delete"
                      onClick={() => removeFacet(f)}
                    />
                  </div>
                </div>
              ))}

            {autocompleteValues
              .filter(val => val.type === 'year')
              .filter(
                val =>
                  !facets.find(f => f.type === val.type && f.data === val.data)
              )
              .sort((a, b) => Number(b.data) - Number(a.data))
              .map(it => (
                <div
                  className="filter-item"
                  key={it.data}
                  onClick={() => addFacet(it)}
                >
                  <div className="tags has-addons">
                    <span className="tag tag-count">{it.count}</span>
                    <span className="tag is-primary">{it.data}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="column">
          <strong>Type</strong>
          <div className="box">
            {facets
              .filter(f => f.type === 'type')
              .map(f => (
                <div key={f.data} className="control">
                  <div className="tags has-addons">
                    <a className="tag is-link">{f.data}</a>
                    <a
                      className="tag is-delete"
                      onClick={() => removeFacet(f)}
                    />
                  </div>
                </div>
              ))}

            {autocompleteValues
              .filter(val => val.type === 'type')
              .filter(
                val =>
                  !facets.find(f => f.type === val.type && f.data === val.data)
              )
              .sort((a, b) => b.count - a.count)
              .map(it => (
                <div
                  className="filter-item"
                  key={it.data}
                  onClick={() => addFacet(it)}
                >
                  <div className="tags has-addons">
                    <span className="tag tag-count">{it.count}</span>
                    <span className="tag is-primary">{it.data}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="column">
          <strong>(Co-)Authors</strong>
          <div className="box">
            {facets
              .filter(f => f.type === 'author')
              .map(f => (
                <div key={f.data} className="control">
                  <div className="tags has-addons">
                    <a className="tag is-link">{f.data}</a>
                    <a
                      className="tag is-delete"
                      onClick={() => removeFacet(f)}
                    />
                  </div>
                </div>
              ))}

            {autocompleteValues
              .filter(val => val.type === 'author')
              .filter(
                val =>
                  !facets.find(f => f.type === val.type && f.data === val.data)
              )
              .sort((a, b) => b.count - a.count)
              .map(it => (
                <div
                  className="filter-item"
                  key={it.data}
                  onClick={() => addFacet(it)}
                >
                  <div className="tags has-addons">
                    <span className="tag tag-count">{it.count}</span>
                    <span className="tag is-primary">{it.data}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {children(filteredPapers)}
    </>
  );
};
