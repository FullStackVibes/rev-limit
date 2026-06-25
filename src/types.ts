export interface Profile {
  id: string;
  business_name: string;
  email: string;
}

export interface Project {
  id: string;
  freelancer_id: string;
  client_name: string;
  project_name: string;
  total_revisions_allowed: number;
  current_revisions_used: number;
  status: 'active' | 'completed';
  share_id: string;
}

export interface Revision {
  id: string;
  project_id: string;
  revision_body: string;
  freelancer_comment: string;
  status: 'pending' | 'reviewed' | 'completed' | 'canceled';
  created_at: string;
}

export interface DatabaseLog {
  id: string;
  timestamp: string;
  type: 'auth_trigger' | 'rls_pass' | 'rls_fail' | 'query' | 'insert' | 'update';
  message: string;
}
