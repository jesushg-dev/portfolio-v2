// First, import the required modules
import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, ref, orderByKey, child, query, get } from 'firebase/database';

import app from '../../../utils/db';

// The type of posts to retrieve (if specified)
let type = null;

// Create a new Next.js serverless function
const getSkills = async (req: NextApiRequest, res: NextApiResponse) => {
  // Parse the query parameters from the request
  // const { start, type } = req.query as { start: string; type: string };
  //use json body instead of query params
  const { type } = req.body as { type?: string | null };
  console.log('🚀 ~ file: index.tsx:16 ~ getSkills ~ type', type);

  // Use the `/en/portfolio` value as the reference to the database location
  const db = getDatabase(app);
  const databaseRef = ref(db, `es-ES/skills`);
  // Use the `equalTo` method to filter the results by type (if specified)
  const queryBuilder = /*type ? query(databaseRef, orderByKey(), equalTo(type)) :*/ child(databaseRef, type || '');

  // Retrieve the results from the database
  const snapshot = await get(queryBuilder);

  // Get the results from the snapshot
  const results = snapshot.val();

  // Return the results in the response
  res.status(200).json(results);
};

// Export the serverless function
export default getSkills;
