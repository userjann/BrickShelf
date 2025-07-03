import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      GOOGLE_CX: process.env.GOOGLE_CX,
      BRICKSET_API_KEY: process.env.BRICKSET_API_KEY,
    },
  };
};
