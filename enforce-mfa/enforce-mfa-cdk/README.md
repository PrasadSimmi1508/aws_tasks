# Add MFA to all users available in -personal AWS Account(IAM all users should have mfa)

## Required dependencies
* `npm install aws-cdk-lib constructs`
* `npm install @aws-cdk/aws-ecs @aws-cdk/aws-cloudwatch @aws-cdk/aws-lambda @aws-cdk/aws-iam`
* `cdk bootstrap; cdk synth; cdk deploy` to run the project
* `{"event": "test"}`  to test the lamda is working or not