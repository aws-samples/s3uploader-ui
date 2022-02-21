# Simple S3 Web Application to upload multiple files
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## About
This repository contains the Open Source Software to demonstrate how to build a simple WebApp to users upload files to S3.  

### Built With

- [AWS Amplify Framework](https://docs.amplify.aws/)
- [Amazon S3](https://aws.amazon.com/s3/)
- [Amazon Cognito](https://aws.amazon.com/cognito/)
- [AWS UI](https://github.com/aws/awsui-documentation)
- [Node.JS](https://nodejs.org/en/)
- [React](https://reactjs.org/)

## Getting Started

First install AWS Amplify CLI
`npm install -g @aws-amplify/cli`

Inside the project folder, initialize Amplify:
`amplify init`
> Project name example: s3-uploader-ui

Add the authentication component
`amplify add auth`

Add the storage component
`amplify add storage`

> Select: Content (Images, audio, video, etc.)
> 
> Provide a label for this category or use the suggested one from the wizard.
>
> Select the option create/update from the list of actions

Add the application hosting
`amplify hosting add`

> Select Amazon CloudFront and S3. Define a new unique bucket name or use the suggested one.

Now, you can build the web app (front-end)

```bash
npm install
amplify push
amplify publish
```

The output of the `amplify publish` if all the deployment was done correctly is a URL
This URL is the web application URl where you can open from the browser to access your application.
By default, the front-end come with the sign-up UI disabled. To enable the sign-up UI you need to change the file: `App.css`

Comment or remove the following block:

```css
.amplify-tabs {
display: none;
}
```
> After this change you need to re-run `amplify publish`


### Prerequisites

To build this solution you must have:
- AWS account
- Permissions to create resources in the AWS account
- Node.js 16.x or higher

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
