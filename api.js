import axios from "axios";

const endPoint =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_day.geojson";

const result = axios.get(endPoint).then(
  (response) => {
    return response.data.features;
  },
  (error) => {
    console.log(error);
  }
);

export default result;
