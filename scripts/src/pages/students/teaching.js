import { graphql, Link } from 'gatsby';
import React from 'react';
import Layout from '../../components/layout';
import SEO from '../../components/seo';
import UKFlag from '../../components/svgs/ukflag.inline.svg';
import DEFlag from '../../components/svgs/deflag.inline.svg';

/**
 * Processes the teaching data from graphql
 * Splits it by year and term
 *
 * @param {Object} edges term data from graphql
 * @returns {Object} data object split by year and term
 */

const canonicalTerm = t => {
  const s = String(t || '')
    .trim()
    .toLowerCase();
  if (['summer', 'ss', 'sose', 's'].includes(s)) return 'Summer';
  if (['winter', 'ws', 'wise', 'w'].includes(s)) return 'Winter';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
};

const displayYear = (year, term) => {
  const base = parseInt(String(year).slice(0, 4), 10);
  if (!Number.isFinite(base)) return year;
  return canonicalTerm(term) === 'Winter' ? `${base}/${base + 1}` : `${base}`;
};

const processData = edges => {
  const years = [...new Set(edges.map(it => it.node.frontmatter.year))];
  const data = {};
  for (const year of years) {
    if (!data[year]) {
      data[year] = {};
    }

    const itemsInYear = edges.filter(it => it.node.frontmatter.year === year);
    const termsInYear = [
      ...new Set(
        itemsInYear.map(it => canonicalTerm(it.node.frontmatter.term))
      ),
    ];

    for (const term of termsInYear) {
      if (!data[year][term]) {
        data[year][term] = {};
      }

      const itemsInYearTerm = itemsInYear.filter(
        it => canonicalTerm(it.node.frontmatter.term) === term
      );
      const typesInTerm = [
        ...new Set(itemsInYearTerm.map(it => it.node.frontmatter.type)),
      ];

      for (const type of typesInTerm) {
        const itemsInYearTermType = itemsInYearTerm.filter(
          it => it.node.frontmatter.type === type
        );
        data[year][term][type] = itemsInYearTermType;
      }
    }
  }

  return data;
};

const iconFor = kind => {
  const k = (kind || '').toLowerCase();
  if (k.includes('seminar')) return '/images/teaching/seminar.png';
  if (k.includes('project')) return '/images/teaching/project.png';
  if (k.includes('lecture')) return '/images/teaching/lecture.png';
};

export default function Teaching({
  data: {
    allMdx: { edges },
  },
}) {
  const result = processData(edges);

  return (
    <Layout withContainer={false}>
      <SEO title="Teaching" />
      <div className="tabs">
        <ul className="container">
          <li className="is-active">
            <a>Teaching</a>
          </li>
          <li>
            <Link to="/students/theses/">Theses</Link>
          </li>
        </ul>
      </div>

      <section className="section teaching-page">
        <div className="container content teaching">
          <h1 className="header">Teaching</h1>

          {Object.keys(result)
            .sort((a, b) => b - a)
            .map(year => (
              <div className="years" key={year}>
                {Object.keys(result[year])
                  .sort((a, b) => b.localeCompare(a))
                  .map(term => (
                    <div className="terms term-wrap" key={term}>
                      <h2 className="term-title">
                        {term} Term {displayYear(year, term)}
                      </h2>
                      <div className="term-card">
                        {Object.keys(result[year][term]).map(kind => {
                          const icon = iconFor(kind);
                          return (
                            <div key={kind}>
                              <div className="kind-row">
                                {icon && (
                                  <img
                                    className="kind-icon"
                                    src={icon}
                                    alt=""
                                    aria-hidden="true"
                                    width="36"
                                    headth="36"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                )}
                                <h3 className="kind">
                                  {kind.replace(/s?$/, 's')}
                                </h3>
                              </div>

                              {result[year][term][kind].map(course => (
                                <div
                                  key={course.node.fields.path}
                                  className="course"
                                >
                                  <Link to={course.node.fields.path}>
                                    {course.node.frontmatter.title}
                                  </Link>
                                  <span className="kind-label">
                                    {course.node.frontmatter.kind}
                                  </span>
                                  {course.node.frontmatter.language ===
                                    'en' && (
                                    <span
                                      className="language"
                                      title="English language"
                                    >
                                      <UKFlag
                                        style={{ width: 24, height: 12 }}
                                      />
                                    </span>
                                  )}
                                  {course.node.frontmatter.language ===
                                    'de' && (
                                    <span
                                      className="language"
                                      title="German language"
                                    >
                                      <DEFlag
                                        style={{ width: 24, height: 12 }}
                                      />
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
        </div>
      </section>
    </Layout>
  );
}

export const pageQuery = graphql`
  query {
    allMdx(
      filter: { fields: { type: { eq: "teaching" } } }
      sort: { fields: frontmatter___year, order: DESC }
    ) {
      edges {
        node {
          id
          fields {
            path
            type
          }
          frontmatter {
            title
            type
            year
            term
            kind
            language
          }
        }
      }
    }
  }
`;
