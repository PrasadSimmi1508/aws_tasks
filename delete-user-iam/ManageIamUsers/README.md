# Delete User From IAM account(Create user and delete user,two functionality works here!!)

# Install these dependencies
* `npm install -g aws-cdk`
* `npm install @aws-cdk/aws-lambda @aws-cdk/aws-iam`

# Test through lambda function

* `{ "action": "create","username": "TestUser", "password": "Temporary@123"}`  create user
* `{  "action": "delete","username": "TestUser"}` delete user

* `cdk bootstrap; cdk synth; cdk deploy` at once to do all task
* ` cdk destroy` to destroy resources
