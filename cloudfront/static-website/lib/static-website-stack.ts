import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs'; // For Construct compatibility
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';

export class StaticWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Step 1: Create an S3 Bucket for static website hosting
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Cleanup on stack deletion
      autoDeleteObjects: true, // Delete objects with the bucket
      publicReadAccess: false, // Use CloudFront for public access
    });

    // Step 2: Set up CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(websiteBucket), // Connect S3 bucket as origin
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // Enforce HTTPS
      },
      defaultRootObject: 'index.html',
    });

    // Step 3: Deploy static files to S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../website'))], // Path to static files
      destinationBucket: websiteBucket,
      distribution, // Invalidate cache after deployment
      distributionPaths: ['/*'], // Invalidate all paths
    });

    // Step 4: Output the CloudFront URL
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${distribution.domainName}`,
      description: 'The URL of the deployed static website',
    });
  }
}
