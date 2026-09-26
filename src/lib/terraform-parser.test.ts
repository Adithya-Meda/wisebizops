import { parseTerraformDeterministically } from './terraform-parser';

describe('Terraform Parser - Essential Edge Cases', () => {
  it('should parse EC2 instances with multiple EBS volumes and OS hints', () => {
    const tf = `
      resource "aws_instance" "web_server" {
        instance_type = "t3.medium"
        # OS: Windows
        root_block_device { volume_type = "gp3", volume_size = 50 }
        ebs_block_device { volume_type = "io1", volume_size = 500 }
      }
    `;
    const res = parseTerraformDeterministically(tf);
    expect(res).toContainEqual({ name: 'Amazon EC2 (t3.medium, Windows)', quantity: 1 });
    expect(res).toContainEqual({ name: 'Amazon EBS (gp3)', quantity: 1, storage: 50 });
    expect(res).toContainEqual({ name: 'Amazon EBS (io1)', quantity: 1, storage: 500 });
  });

  it('should fallback to Linux and default EBS values if missing', () => {
    const tf = `
      resource "aws_instance" "bare_metal" {
        instance_type = "c5.large"
        root_block_device {}
      }
    `;
    const res = parseTerraformDeterministically(tf);
    expect(res).toContainEqual({ name: 'Amazon EC2 (c5.large, Linux)', quantity: 1 });
    expect(res).toContainEqual({ name: 'Amazon EBS (gp2)', quantity: 1, storage: 8 });
  });

  it('should parse RDS Multi-AZ vs Single-AZ deployments', () => {
    const tf = `
      resource "aws_db_instance" "primary" {
        instance_class = "db.r6g.xlarge"
        engine = "postgres"
        multi_az = true
        allocated_storage = 1000
      }
      resource "aws_db_instance" "replica" {
        instance_class = "db.t4g.large"
        engine = "mysql"
        multi_az = false
      }
    `;
    const res = parseTerraformDeterministically(tf);
    expect(res).toContainEqual({ name: 'Amazon RDS (PostgreSQL, db.r6g.xlarge, Multi-AZ)', quantity: 1 });
    expect(res).toContainEqual({ name: 'Amazon EBS (gp2)', quantity: 1, storage: 1000 });
    expect(res).toContainEqual({ name: 'Amazon RDS (MySQL, db.t4g.large, Single-AZ)', quantity: 1 });
  });

  it('should correctly map S3 storage classes', () => {
    const tf = `
      resource "aws_s3_bucket" "glacier" { storage_class = "GLACIER" }
      resource "aws_s3_bucket" "intelligent" { storage_class = "INTELLIGENT_TIERING" }
      resource "aws_s3_bucket" "standard" {}
    `;
    const res = parseTerraformDeterministically(tf);
    expect(res).toContainEqual({ name: 'Amazon S3 (Glacier)', quantity: 1, storage: 10 });
    expect(res).toContainEqual({ name: 'Amazon S3 (Intelligent-Tiering)', quantity: 1, storage: 10 });
    expect(res).toContainEqual({ name: 'Amazon S3 (Standard)', quantity: 1, storage: 10 });
  });

  it('should differentiate Load Balancer types', () => {
    const tf = `
      resource "aws_lb" "alb" { load_balancer_type = "application" }
      resource "aws_lb" "nlb" { load_balancer_type = "network" }
      resource "aws_lb" "default" {}
    `;
    const res = parseTerraformDeterministically(tf);
    expect(res).toContainEqual({ name: 'Elastic Load Balancing (Application)', quantity: 1 });
    expect(res).toContainEqual({ name: 'Elastic Load Balancing (Network)', quantity: 1 });
  });

  it('should differentiate EKS Node Groups from Fargate Profiles', () => {
    const tf = `
      resource "aws_eks_cluster" "cluster" {}
      resource "aws_eks_fargate_profile" "fargate" {}
    `;
    const res = parseTerraformDeterministically(tf);
    expect(res).toContainEqual({ name: 'Amazon EKS (Standard)', quantity: 1 });
    expect(res).toContainEqual({ name: 'Amazon EKS (Fargate)', quantity: 1 });
  });

  it('should auto-assign macOS for mac-prefixed instance types', () => {
    const tf = `
      resource "aws_instance" "mac" { instance_type = "mac2.metal" }
    `;
    const res = parseTerraformDeterministically(tf);
    expect(res).toContainEqual({ name: 'Amazon EC2 (mac2.metal, macOS)', quantity: 1 });
  });
});
