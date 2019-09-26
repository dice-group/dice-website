import React from 'react';
import Layout from '../components/layout';
import News from '../components/news';
import SEO from '../components/seo';

export default function NewsTemplate() {
  return (
    <Layout>
      <SEO title="News" />
      <div className="content">
        <h1>News</h1>
        <News />
      </div>
    </Layout>
  );
}
