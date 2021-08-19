require('dotenv').config();
import fs from 'fs';
import Jimp = require('jimp');
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { NextFunction } from 'connect';
import { User } from '../model/User';
import { config } from '../config/config';
import { Request, Response } from 'express';

// filterImageFromURL
// helper function to download, filter, and save the filtered image locally
// returns the absolute path to the local image
// INPUTS
//    inputURL: string - a publicly accessible url to an image file
// RETURNS
//    an absolute path to a filtered image locally saved file
export async function filterImageFromURL(inputURL: string): Promise<string>{
    return new Promise( async resolve => {
        const photo = await Jimp.read(inputURL);
        const outpath = '/tmp/filtered.'+Math.floor(Math.random() * 2000)+'.jpg';
        await photo
        .resize(256, 256) // resize
        .quality(60) // set JPEG quality
        .greyscale() // set greyscale
        .write(__dirname+outpath, (img)=>{
            resolve(__dirname+outpath);
        });
    });
}

// deleteLocalFiles
// helper function to delete files on the local disk
// useful to cleanup after tasks
// INPUTS
//    files: Array<string> an array of absolute paths to files
export async function deleteLocalFiles(files:Array<string>){
    for( let file of files) {
        fs.unlinkSync(file);
    }
}

// Validating URL function
export function isValidURL(url: string) {
    let regex = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    return regex.test(url);
  }
  
  // Validating Image Url
export function isImageURL(url: string) {
    return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
  }

/*************************************************************Authentication method*****************************************************/
export async function generatePassword(plainTextPassword: string): Promise<string> {
    //@TODO Use Bcrypt to Generated Salted Hashed Passwords
   const rounds = 10;
   const salt = await bcrypt.genSalt(rounds);
   const hash = await bcrypt.hash(plainTextPassword, salt);
   return hash;
}

export async function comparePasswords(plainTextPassword: string, hash: string): Promise<boolean> {
    //@TODO Use Bcrypt to Compare your password to your Salted Hashed Password
    return await bcrypt.compare(plainTextPassword, hash);
}

export function generateJWT(user: User): string {
    //@TODO Use jwt to create a new JWT Payload containing
    return jwt.sign(user.toJSON(), config.jwt.secret);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    //    console.warn("auth.router not yet implemented, you'll cover this in lesson 5")
     //   return next();
         if (!req.headers || !req.headers.authorization){
             return res.status(401).send({ message: 'No authorization headers.' });
         }
        
    
         const token_bearer = req.headers.authorization.split(' ');
         if(token_bearer.length != 2){
             return res.status(401).send({ message: 'Malformed token.' });
         }
        
         const token = token_bearer[1];
    
         return jwt.verify(token, config.jwt.secret, (err, decoded) => {
           if (err) {
             return res.status(500).send({ auth: false, message: 'Failed to authenticate.' });
           }
           return next();
         });
    }