-- Seed mock users (password: "password123" for all)
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'john.dev@example.com', '$2b$12$ORBfnn6B8yVPy.OLHsZPye9w1v.eVj/zlgWDxNRkcq68oM3IGAZCa', 'John Smith', 'developer', true),
  ('a0000000-0000-0000-0000-000000000002', 'jane.qa@example.com', '$2b$12$ORBfnn6B8yVPy.OLHsZPye9w1v.eVj/zlgWDxNRkcq68oM3IGAZCa', 'Jane Doe', 'qa', true),
  ('a0000000-0000-0000-0000-000000000003', 'bob.pm@example.com', '$2b$12$ORBfnn6B8yVPy.OLHsZPye9w1v.eVj/zlgWDxNRkcq68oM3IGAZCa', 'Bob Wilson', 'pm', true),
  ('a0000000-0000-0000-0000-000000000004', 'alice.devops@example.com', '$2b$12$ORBfnn6B8yVPy.OLHsZPye9w1v.eVj/zlgWDxNRkcq68oM3IGAZCa', 'Alice Brown', 'devops', true),
  ('a0000000-0000-0000-0000-000000000005', 'charlie.po@example.com', '$2b$12$ORBfnn6B8yVPy.OLHsZPye9w1v.eVj/zlgWDxNRkcq68oM3IGAZCa', 'Charlie Davis', 'po', true),
  ('a0000000-0000-0000-0000-000000000006', 'admin@example.com', '$2b$12$ORBfnn6B8yVPy.OLHsZPye9w1v.eVj/zlgWDxNRkcq68oM3IGAZCa', 'Admin User', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Seed mock projects
INSERT INTO projects (id, name, description, status, health)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Project Alpha', 'E-commerce platform redesign with new checkout flow and payment integration. Q2 priority initiative.', 'active', 'green'),
  ('b0000000-0000-0000-0000-000000000002', 'Project Beta', 'Internal dashboard for real-time analytics and reporting. Currently in beta testing phase.', 'active', 'yellow'),
  ('b0000000-0000-0000-0000-000000000003', 'Project Gamma', 'Legacy system migration to microservices architecture. Experiencing delays due to dependency conflicts.', 'active', 'red')
ON CONFLICT DO NOTHING;

-- Seed employee-project assignments
INSERT INTO employee_projects (id, user_id, project_id, role_on_project)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Backend Developer'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'QA Engineer'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Project Manager'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'DevOps Engineer'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Product Owner'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Backend Developer'),
  ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'QA Engineer'),
  ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Project Manager'),
  ('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Backend Developer'),
  ('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Project Manager')
ON CONFLICT DO NOTHING;

-- Seed tasks for Project Alpha
INSERT INTO tasks (id, project_id, assignee_id, title, description, status, is_completed)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Implement checkout API', 'Build REST endpoints for checkout flow including cart validation and payment initiation', 'in_progress', false),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Integrate payment gateway', 'Connect Razorpay SDK for payment processing with webhook handling', 'todo', false),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Write checkout test suite', 'Cover cart, payment, and order confirmation flows with integration tests', 'done', true),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'Set up CI/CD pipeline', 'Configure GitHub Actions for automated testing and deployment to staging', 'in_progress', false)
ON CONFLICT DO NOTHING;

-- Seed tasks for Project Beta
INSERT INTO tasks (id, project_id, assignee_id, title, description, status, is_completed)
VALUES
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Build data aggregation service', 'Create service to aggregate metrics from multiple data sources', 'in_progress', false),
  ('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Test dashboard performance', 'Run load testing on dashboard with 10k concurrent users', 'todo', false),
  ('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', null, 'Design chart components', 'Create reusable React chart components with filtering capabilities', 'todo', false)
ON CONFLICT DO NOTHING;

-- Seed tasks for Project Gamma
INSERT INTO tasks (id, project_id, assignee_id, title, description, status, is_completed)
VALUES
  ('d0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Migrate user service', 'Move user service from monolith to new microservice architecture', 'in_progress', false),
  ('d0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000003', null, 'Resolve dependency conflicts', 'Fix version conflicts between legacy and new dependencies in the migration path', 'blocked', false),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000003', null, 'Database schema migration', 'Plan and execute database schema changes for new microservices', 'todo', false)
ON CONFLICT DO NOTHING;

-- Seed project updates
INSERT INTO project_updates (id, project_id, author_id, content, update_type)
VALUES
  -- Project Alpha updates
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Checkout API endpoints completed. Ready for QA review.', 'milestone'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'QA testing started on checkout flow. Found 3 minor issues.', 'general'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'Client approved the checkout UI design. Proceeding with implementation.', 'milestone'),
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'CI/CD pipeline configured. Deploying to staging environment.', 'general'),

  -- Project Beta updates
  ('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'Beta release delayed by 1 week due to data aggregation complexity.', 'escalation'),
  ('e0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Data aggregation service 60% complete. Performance is within acceptable range.', 'general'),

  -- Project Gamma updates
  ('e0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'ESCALATION: Migration blocked by dependency conflicts. Need architecture review.', 'escalation'),
  ('e0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'User service partially migrated but blocked by auth dependency.', 'general'),
  ('e0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Scheduling architecture review meeting for next week to unblock migration.', 'general')
ON CONFLICT DO NOTHING;
