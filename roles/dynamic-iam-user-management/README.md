# Lambda to for users to use different roles - like Developers, Admin, DevOps, Tester,etc - with a set of permissions, using CDK - in pers AWS account

* `npm install -g aws-cdk`
* `npm install @aws-cdk/aws-iam @aws-cdk/aws-lambda @aws-cdk/aws-s3 @aws-cdk/aws-lambda-event-sources`
## Test Lambda
* `{ "action": "create","userName": "johnDoe", "password": "SecurePassword123", "userRole": "Developer"}`
* `{"action": "addToGroup", "userName": "janeDoe","userRole": "Admin"}`
* `{"action": "delete","userName": "johnDoe"}`

* `cdk bootstrap; cdk synth; cdk deploy`
