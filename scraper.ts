const target = process.argv[2] as "basic" | "youtube";
const scraper = require(`./${target}-scraper/${target}-scraper`) as {
  default: () => void;
};

scraper.default();
