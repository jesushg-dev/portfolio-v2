'use client';

import Error from 'next/error';

// This page renders when a route is requested that doesn't match the
// middleware and therefore doesn't have a locale associated with it.

const NotFound = () => {
  return (
    <html lang="en">
      <body>
        <Error statusCode={404} />
      </body>
    </html>
  );
};

export default NotFound;
