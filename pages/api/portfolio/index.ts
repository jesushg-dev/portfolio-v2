// First, import the required modules
import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, ref, orderByKey, orderByChild } from 'firebase/database';
import { limitToFirst, startAt, query, equalTo, get, limitToLast } from 'firebase/database';

import app from '../../../utils/db';

// The number of results to return per page

// Create a new Next.js serverless function
const pagination = async (req: NextApiRequest, res: NextApiResponse) => {
  // Parse the query parameters from the request
  // const { page, type } = req.query as { page: string; type: string };
  //use json body instead of query params
  const {
    page,
    type,
    pageSize = 10,
    lang,
  } = req.body as { page: string; type?: string; pageSize?: number; lang: string };

  if (!page || Number(page) < 1) {
    res.status(400).send({
      message: 'Please specify a page number greater than 0.',
    });
    return;
  }

  if (!lang) {
    res.status(400).send({
      message: 'Please specify a "lang" parameter. (en-US, es-ES)',
    });
    return;
  }

  // Calculate the start value for the query
  const start = String((Number(page) - 1) * pageSize);

  // Get a reference to the database
  const db = getDatabase(app);
  const databaseRef = ref(db, `${lang}/portfolio`);

  // If a type has been specified, filter the results by this value
  // Use the `limitToFirst` and `equalTo` methods to retrieve the current page of results
  const queryBuilder = type
    ? query(
        databaseRef,
        limitToFirst(pageSize * (Number(page) + 1)),
        limitToLast(pageSize),
        orderByChild('type'),
        equalTo(type)
      )
    : query(databaseRef, limitToFirst(pageSize), startAt(start), orderByKey());

  // Retrieve the results from the database
  const snapshot = await get(queryBuilder);

  // Check if there are any results
  if (snapshot.hasChildren()) {
    // Get the results from the snapshot
    const results = snapshot.val();

    // Check if exists a least one more result to load (next page)
    const nextPage = type
      ? query(databaseRef, limitToFirst(1), startAt(start + pageSize), orderByChild('type'), equalTo(type))
      : query(databaseRef, limitToFirst(1), startAt(start + pageSize), orderByKey());

    /*
    
    
    */

    // Retrieve the results from the database
    const checkMore = await get(nextPage);

    // Check if there are any results
    const hasMore = checkMore.hasChildren();

    // Create the results object
    const resultsObj = {
      results: Object.values(results),
      nextPage: hasMore ? Number(page) + 1 : null,
    };

    // Return the results in the response
    res.status(200).json(resultsObj);
  } else {
    // There are no more pages to load
    res.status(404).send({
      message:
        'This page does not exist, please check "nextPage" property to be safe that you are not requesting a page that does not exist.',
    });
  }
};

// Export the serverless function
export default pagination;
