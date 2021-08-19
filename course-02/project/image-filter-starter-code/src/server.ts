require('dotenv').config();
import express from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles,isValidURL, isImageURL, requireAuth, generatePassword, comparePasswords, generateJWT  } from './util/util';
import * as EmailValidator from 'email-validator';
import { User } from './model/User';
import { sequelize } from './sequelize';
import { V0MODELS } from './model.index';


(async () => {
  sequelize.addModels(V0MODELS);
 //await sequelize.sync();
  
 // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  /********************************************FilterImage endpoint*******************************************************/
   
   app.get("/filteredimage", 
   requireAuth,
   async ( req : express.Request, res : express.Response ) => {
    

    let url:any  = req.query.image_url;
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

/**********************************************Authentication EndPoints****************************************************** */
  app.get('/auth/verification', 
    requireAuth, 
    async (req: express.Request, res: express.Response) => {
        return res.status(200).send({ auth: true, message: 'Authenticated.' });
});

                         /************************login endpoints*************************/
app.post('/auth/login', async (req: express.Request, res: express.Response) => {
  const email = req.body.email;
  const password = req.body.password;
  // check email is valid
  if (!email || !EmailValidator.validate(email)) {
      return res.status(400).send({ auth: false, message: 'Email is required or malformed' });
  }

  // check email password valid
  if (!password) {
      return res.status(400).send({ auth: false, message: 'Password is required' });
  }

  const user = await User.findByPk(email);
  // check that user exists
  if(!user) {
      return res.status(401).send({ auth: false, message: 'Unauthorized' });
  }

  // check that the password matches
  const authValid = await comparePasswords(password, user.password_hash)

  if(!authValid) {
      return res.status(401).send({ auth: false, message: 'Unauthorized' });
  }

  // Generate JWT
  const jwt = generateJWT(user);

  res.status(200).send({ auth: true, token: jwt, user: user.short()});
});
 

                          /************************Register endpoints*************************/
//register a new user
app.post('/auth/register', async (req: express.Request, res: express.Response) => {
  const email = req.body.email;
  const plainTextPassword = req.body.password;
  // check email is valid
  if (!email || !EmailValidator.validate(email)) {
      return res.status(400).send({ auth: false, message: 'Email is required or malformed' });
  }

  // check email password valid
  if (!plainTextPassword) {
      return res.status(400).send({ auth: false, message: 'Password is required' });
  }

  // find the user
  const user = await User.findByPk(email);
  // check that user doesnt exists
  if(user) {
      return res.status(422).send({ auth: false, message: 'User may already exist' });
  }

  const password_hash = await generatePassword(plainTextPassword);

  const newUser = await new User({
      email: email,
      password_hash: password_hash
  });

  let savedUser;
  try {
      savedUser = await newUser.save();
  } catch (e) {
      throw e;
  }

  // Generate JWT
  const jwt = generateJWT(savedUser);

  res.status(201).send({token: jwt, user: savedUser.short()});
});

/*****get all users ***************************************************************************************************/
// Get all feed items
app.get('/users',  
async (req: express.Request, res: express.Response) => {
    const users = await User.findAll();
    res.status(200).send(users);
});


/********************************************************************************************************************** */
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