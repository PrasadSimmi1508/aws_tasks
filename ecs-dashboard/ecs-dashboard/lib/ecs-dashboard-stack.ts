import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class EcsDashboardStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Fetch the default VPC
        const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: true });

        // Fetch an existing ECS Cluster
        const cluster = ecs.Cluster.fromClusterAttributes(this, 'Cluster', {
            clusterName: 'MyCluster', // Replace with your ECS cluster name
            vpc: vpc,
        });

        // Fetch an existing ECS Service
        const service = ecs.FargateService.fromFargateServiceAttributes(this, 'Service', {
            cluster: cluster,
            serviceName: 'MyService', // Replace with your ECS service name
        });

        // Create a CloudWatch Dashboard
        const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
            dashboardName: 'EcsDashboard',
            
        });

        // Define Metrics
        const cpuMetric = new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'CPUUtilization',
            dimensionsMap: {
                ClusterName: 'MyCluster',
                ServiceName: 'MyService',
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
        });

        const memoryMetric = new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'MemoryUtilization',
            dimensionsMap: {
                ClusterName: 'MyCluster',
                ServiceName: 'MyService',
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
        });

        const networkInMetric = new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'NetworkRxBytes',
            dimensionsMap: {
                ClusterName: 'MyCluster',
                ServiceName: 'MyService',
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
        });

        const networkOutMetric = new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'NetworkTxBytes',
            dimensionsMap: {
                ClusterName: 'MyCluster',
                ServiceName: 'MyService',
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
        });

        // Add Widgets to the Dashboard
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'CPU Utilization',
                left: [cpuMetric],
            }),
            new cloudwatch.GraphWidget({
                title: 'Memory Utilization',
                left: [memoryMetric],
            }),
            new cloudwatch.GraphWidget({
                title: 'Network Traffic (In/Out)',
                left: [networkInMetric],
                right: [networkOutMetric],
            })
        );
    }
}
