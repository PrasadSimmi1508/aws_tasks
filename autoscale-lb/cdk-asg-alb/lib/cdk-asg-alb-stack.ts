import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export class CdkAsgAlbStack extends Stack {
  constructor(scope: cdk.App, id: string, props?: StackProps) {
    super(scope, id, props);

    // Fetch account ID and region dynamically
    const accountId = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;
    console.log(`Deploying to Account: ${accountId}, Region: ${region}`);

    // Use default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });


    // Security Group for ASG instances
    const asgSecurityGroup = new ec2.SecurityGroup(this, 'CustomAsgSecurityGroup', {
      vpc,
      description: 'Allow SSH and HTTP access for EC2 instances',
      allowAllOutbound: true,
      securityGroupName: 'MyCustomAsgSecurityGroup', // Custom name
    });
    asgSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');
    asgSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP access');

    // Define an AMI
    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    });

    // Create an Auto Scaling Group

    const asg = new autoscaling.AutoScalingGroup(this, 'CustomASG', {
      vpc,
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ami,
      minCapacity: 1,
      maxCapacity: 2,
      desiredCapacity: 1,
      keyName: 'ansible-kp', // Replace with your SSH key name
      securityGroup: asgSecurityGroup,
      autoScalingGroupName: 'MyCustomASG', // Custom name
    });

    // Add User Data for web server setup
    asg.addUserData(
      `#!/bin/bash
      yum update -y
      yum install -y httpd
      systemctl start httpd
      systemctl enable httpd
      echo "Hello from EC2 instance $(hostname)" > /var/www/html/index.html`
    );

    // Create an Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'CustomALB', {
      vpc,
      internetFacing: true,
      loadBalancerName: 'MyCustomALB', // Custom name
    });


    // Add a listener to the ALB
    const listener = alb.addListener('CustomListener', {
      port: 80,
      open: true,
    });

    // Add ASG instances to the ALB target group
    listener.addTargets('CustomTargetGroup', {
      port: 80,
      targets: [asg],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
      },
      targetGroupName: 'MyCustomTargetGroup', // Custom name
    });

    // Define CloudWatch Metrics for scaling
    const cpuUtilizationMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: asg.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    // Create CloudWatch Alarms for scaling policies
    const highCpuAlarm = new cloudwatch.Alarm(this, 'CustomHighCpuAlarm', {
      metric: cpuUtilizationMetric,
      threshold: 30,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmName: 'MyCustomHighCpuAlarm', // Custom name
    });

    const lowCpuAlarm = new cloudwatch.Alarm(this, 'CustomLowCpuAlarm', {
      metric: cpuUtilizationMetric,
      threshold: 30,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmName: 'MyCustomLowCpuAlarm', // Custom name
    });

    // Add scaling policies
    asg.scaleOnMetric('ScaleOutPolicy', {
      metric: highCpuAlarm.metric,
      scalingSteps: [
        { lower: 30, change: +1 }, // Scale out
        { lower: 50, change: +2 }, // Additional scale out for higher load
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    asg.scaleOnMetric('ScaleInPolicy', {
      metric: lowCpuAlarm.metric,
      scalingSteps: [
        { upper: 30, change: -1 }, // Scale in
        { upper: 10, change: -2 }, // Additional scale in for lower load
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });
  }
}
