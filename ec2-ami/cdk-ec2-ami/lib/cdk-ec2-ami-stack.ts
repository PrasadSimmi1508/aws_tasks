import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CdkEc2AmiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Fetch the default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true });

    // Define user data to install and start NGINX
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'sudo yum update -y',
      'sudo amazon-linux-extras enable nginx1',
      'sudo yum install -y nginx',
      'sudo systemctl start nginx',
      'sudo systemctl enable nginx'
    );

    // Create a security group for the EC2 instance
    const securityGroup = new ec2.SecurityGroup(this, 'MyInstanceSG', {
      vpc,
      description: 'Allow SSH and HTTP access',
      allowAllOutbound: true,
    });

    // Allow SSH access from anywhere (adjust CIDR range as needed)
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');

    // Allow HTTP access from anywhere
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP access');

    // Specify the key pair name (ensure the key exists in your AWS account)
    const keyName = 'ansible-kp'; // Replace with your actual key pair name

    // Create an EC2 instance
    const instance = new ec2.Instance(this, 'MyInstance', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc,
      securityGroup,
      keyName, // Use your SSH key pair
      userData,
    });

    // Add IAM role to allow instance management
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    instance.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'));

    // Output the EC2 Instance ID
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
    });

    // Output the public IP address
    new cdk.CfnOutput(this, 'PublicIP', {
      value: instance.instancePublicIp,
    });

    // Output the key pair name
    new cdk.CfnOutput(this, 'KeyName', {
      value: keyName,
    });
  }
}
