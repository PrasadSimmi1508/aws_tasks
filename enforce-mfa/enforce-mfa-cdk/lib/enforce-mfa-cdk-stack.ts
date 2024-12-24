import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';

export class EnforceMFAStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a Lambda function to enforce MFA
    const enforceMFALambda = new lambda.Function(this, 'EnforceMFALambda', {
      runtime: lambda.Runtime.NODEJS_16_X,   // Choose the Node.js runtime
      handler: 'enforce-mfa.handler',              // Specify handler (entry point of the Lambda function)
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),  // Point to the Lambda folder
      timeout: cdk.Duration.seconds(10),    // Set timeout to 10 seconds
    });

    // Create IAM policy for the Lambda function
    const lambdaPolicy = new iam.PolicyStatement({
      actions: [
        'iam:ListUsers',     // Permission to list IAM users
        'iam:PutUserPolicy', // Permission to attach IAM policies to users
      ],
      resources: ['arn:aws:iam::*:user/*'], // All IAM users in the account
    });

    // Attach the policy to the Lambda execution role
    enforceMFALambda.addToRolePolicy(lambdaPolicy);

    // Output the Lambda function name (for reference)
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: enforceMFALambda.functionName,
    });
  }
}
