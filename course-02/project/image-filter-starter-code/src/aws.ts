import AWS = require('aws-sdk');
import { config } from './config/config';

const c = config.dev;

//Configure AWS
var credentials = new AWS.SharedIniFileCredentials({profile: c.aws_profile});
AWS.config.credentials = credentials;