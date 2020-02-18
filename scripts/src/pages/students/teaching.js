import { graphql, Link } from 'gatsby';
import React from 'react';
import Layout from '../../components/layout';
import SEO from '../../components/seo';
import UKFlag from '../../components/svgs/ukflag.inline.svg';

/**
 * Processes the teaching data from graphql
 * Splits it by year and term
 *
 * @param {Object} edges term data from graphql
 * @returns {Object} data object split by year and term
 */
const processData = edges => {
  const years = [...new Set(edges.map(it => it.node.frontmatter.year))];
  const data = {};
  for (const year of years) {
    if (!data[year]) {
      data[year] = {};
    }

    const itemsInYear = edges.filter(it => it.node.frontmatter.year === year);
    const termsInYear = [
      ...new Set(itemsInYear.map(it => it.node.frontmatter.term)),
    ];

    for (const term of termsInYear) {
      if (!data[year][term]) {
        data[year][term] = {};
      }

      const itemsInYearTerm = itemsInYear.filter(
        it => it.node.frontmatter.term === term
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
            <Link to="/students/mentoring/">Mentoring</Link>
          </li>
          <li>
            <Link to="/students/theses/">Theses</Link>
          </li>
        </ul>
      </div>

      <section className="section">
        <div className="container content teaching">
          <h1 className="header">Teaching</h1>

          {Object.keys(result)
            .sort((a, b) => b - a)
            .map(year => (
              <div className="years" key={year}>
                <h2 className="subheader">{year}</h2>

                {Object.keys(result[year])
                  .sort((a, b) => b.localeCompare(a))
                  .map(term => (
                    <div className="terms" key={term}>
                      <h3 className="term">{term} Term</h3>

                      {Object.keys(result[year][term]).map(kind => (
                        <div key={kind}>
                          <div className="kind">{kind}</div>

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
                              {course.node.frontmatter.language === 'en' && (
                                <span
                                  className="language"
                                  title="English language"
                                >
                                  <UKFlag style={{ width: 24, height: 12 }} />
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
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
