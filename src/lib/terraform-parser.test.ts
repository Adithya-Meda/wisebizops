import { parseTerraformDeterministically } from './terraform-parser';

describe('Terraform Parser', () => {
  it('should parse EC2 instances with multiple EBS volumes and custom OS', () => {
    const tf = `
      resource "aws_instance" "web_server_primary" {
        ami           = "ami-0c55b159cbfafe1f0"
        instance_type = "t3.medium"
        # OS: Windows
        
        root_block_device {
          volume_size = 50
          volume_type = "gp3"
        }
        
        ebs_block_device {
          device_name = "/dev/sdf"
          volume_size = 500
          volume_type = "io1"
        }
      }
    `;
    const res = parseTerraformDeterministically(tf);
    expect(res).toContainEqual({ name: 'Amazon EC2 (t3.medium, Windows)', quantity: 1 });
    expect(res).toContainEqual({ name: 'Amazon EBS (gp3)', quantity: 1, storage: 50 });
    expect(res).toContainEqual({ name: 'Amazon EBS (io1)', quantity: 1, storage: 500 });
  });

  it('should parse RDS Multi-AZ and Single-AZ deployments', () => {
    const tf = `
      resource "aws_db_instance" "primary_postgres" {
        allocated_storage    = 1000
        engine               = "postgres"
        instance_class       = "db.r6g.xlarge"
        multi_az             = true
      }
      resource "aws_db_instance" "analytics_mysql" {
        allocated_storage    = 500
        engine               = "mysql"
        instance_class       = "db.t4g.large"
        multi_az             = false
      }
    `;
    const res = parseTerraformDeterministically(tf);
    expect(res).toContainEqual({ name: 'Amazon RDS (PostgreSQL, db.r6g.xlarge, Multi-AZ)', quantity: 1, storage: 1000 });
    expect(res).toContainEqual({ name: 'Amazon RDS (MySQL, db.t4g.large, Single-AZ)', quantity: 1, storage: 500 });
  });

  it('should parse S3 storage classes correctly', () => {
    const tf = `
      resource "aws_s3_bucket" "prod_backups" {
        bucket = "company-production-database-backups"
        storage_class = "GLACIER"
      }
      resource "aws_s3_bucket" "normal" {
        bucket = "normal"
      }
    `;
    const res = parseTerraformDeterministically(tf);
    expect(res).toContainEqual({ name: 'Amazon S3 (Glacier)', quantity: 1, storage: 10 });
    expect(res).toContainEqual({ name: 'Amazon S3 (Standard)', quantity: 1, storage: 10 });
  });

  it('should fallback macOS detection for mac instances', () => {
    const tf = `
      resource "aws_instance" "mac_node" {
        ami           = "ami-123"
        instance_type = "mac2.metal"
      }
    `;
    const res = parseTerraformDeterministically(tf);
    expect(res).toContainEqual({ name: 'Amazon EC2 (mac2.metal, macOS)', quantity: 1 });
  });
});
