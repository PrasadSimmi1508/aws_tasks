# Reset or update the password of users which are available in the IAM 
* `npm install -g aws-cdk`
* `npm install @aws-cdk/aws-lambda @aws-cdk/aws-iam`
* `{"body": "{\"action\": \"createUser\", \"userName\": \"test-user\", \"password\": \"TestPassword123!\"}"}`
* `{"body": "{\"action\": \"resetPassword\", \"userName\": \"test-user\", \"newPassword\": \"NewPassword456!\"}"}`
* `cdk bootstrap; cdk synth; cdk deploy;`
