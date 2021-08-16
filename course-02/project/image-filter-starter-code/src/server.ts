import express from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles,isValidURL, isImageURL } from './util/util';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // FilterImage endpoint 
  /*********************************************************************************************************************** */
   app.get("/filteredimage", async ( req : express.Request, res : express.Response ) => {
    
    let url = req.query.image_url;
   // 1. validate the image_url query
    if (!url) {
      return res.status(400).send("Image url is required");
    } else if (!isValidURL(url) || !isImageURL(url)) {
      res.status(400).send({ message: "Invalid image URL" });
    } else {
    // 2. call filterImageFromURL(image_url) to filter the image
    const filteredPath = await filterImageFromURL(url);
    //    3. send the resulting file in the response
    res.status(200).sendFile(filteredPath, err => {
      if (err) {
          console.log(err);
          res.sendStatus(500);
      }
      deleteLocalFiles([filteredPath]);
    }); 
  }
  });

  /**************************************************************************** */

  
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();