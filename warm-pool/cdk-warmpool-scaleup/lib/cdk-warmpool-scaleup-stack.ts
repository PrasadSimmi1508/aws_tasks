import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CdkWarmpoolScaleupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Dynamically fetch account and region
    const account = this.account;
    const region = this.region;

    console.log(`Deploying in Account: ${account}, Region: ${region}`);

    // Use default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true });

    // Create a security group
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');

    // Use an existing key pair
    const keyPairName = process.env.EXISTING_KEY_PAIR || 'ansible-kp'; // Replace with your key pair name or set it via ENV

    // Create an IAM role for EC2 instances
    const role = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    // Launch template with user data
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'amazon-linux-extras enable nginx1',
      'yum install -y nginx',
      'systemctl start nginx',
      'systemctl enable nginx',
      'echo "<h1>Welcome to NGINX - Deployed via AWS CDK</h1>" > /usr/share/nginx/html/index.html'
    );

    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      instanceType: new ec2.InstanceType('t2.micro'),
      securityGroup,
      keyName: keyPairName, // Use the existing key pair
      role,
      userData,
    });

    // Create Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
      vpc,
      launchTemplate: launchTemplate,
      minCapacity: 1,
      desiredCapacity: 2,
      maxCapacity: 4,
    });

    // Add a warm pool
    autoScalingGroup.addWarmPool({
      minSize: 2,
      maxGroupPreparedCapacity: 4, // Updated property name
      poolState: autoscaling.PoolState.STOPPED,
    });

    // Output the key pair and security group details
    new cdk.CfnOutput(this, 'KeyPairName', {
      value: keyPairName,
      description: 'Key Pair Name for SSH access',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroupId,
      description: 'Security Group ID for the instances',
    });
  }
}
