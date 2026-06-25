import { useState, useEffect, FormEvent } from "react";
import { 
  Database, 
  Terminal, 
  Copy, 
  Check, 
  Plus, 
  Send, 
  User, 
  Folder, 
  Lock, 
  ShieldAlert, 
  Eye, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  ArrowRight,
  UserPlus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code,
  Layers,
  FileText,
  Key,
  DatabaseZap,
  LogOut,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SQL_SCRIPT, EXPLANATION_SECTIONS } from "./sqlCode";
import { Profile, Project, Revision, DatabaseLog } from "./types";
import { supabase as defaultSupabase, getSupabaseConfig, initSupabaseClient } from "./supabaseClient";
import { createClient } from "@supabase/supabase-js";

// Unique ID generators for client-side simulator
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const randomHex = () => Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

export default function App() {
  // Navigation & View tabs
  const [currentTab, setCurrentTab] = useState<"sql" | "simulator">("simulator");
  const [simulatorRole, setSimulatorRole] = useState<"freelancer" | "client">("freelancer");

  // Live Database Integration State
  const [dbMode, setDbMode] = useState<"sandbox" | "live">("sandbox");
  const [supabaseUrl, setSupabaseUrl] = useState(getSupabaseConfig().url);
  const [supabaseKey, setSupabaseKey] = useState(getSupabaseConfig().key);
  const [liveClient, setLiveClient] = useState(() => initSupabaseClient(getSupabaseConfig().url, getSupabaseConfig().key));
  const [liveSessionUser, setLiveSessionUser] = useState<any>(null);
  
  const [liveProfiles, setLiveProfiles] = useState<Profile[]>([]);
  const [liveProjects, setLiveProjects] = useState<Project[]>([]);
  const [liveRevisions, setLiveRevisions] = useState<Revision[]>([]);
  
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusinessName, setAuthBusinessName] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // SQL Copy State
  const [sqlCopied, setSqlCopied] = useState(false);

  // Core Simulation State
  const [profiles, setProfiles] = useState<Profile[]>([
    { id: "usr_free_1", business_name: "Apex Pixel Studio", email: "hello@apexpixel.io" },
    { id: "usr_free_2", business_name: "Vivid Code Labs", email: "clara@vividcode.com" }
  ]);

  const [activeProfileId, setActiveProfileId] = useState<string>("");

  const [projects, setProjects] = useState<Project[]>([
    {
      id: "proj_1",
      freelancer_id: "usr_free_1",
      client_name: "Acme Corporation",
      project_name: "SaaS Landing Page Redesign",
      total_revisions_allowed: 5,
      current_revisions_used: 2,
      status: "active",
      share_id: "7a8f12c9b4e3f01a"
    },
    {
      id: "proj_2",
      freelancer_id: "usr_free_1",
      client_name: "Stellar Foods",
      project_name: "E-Commerce App Branding",
      total_revisions_allowed: 3,
      current_revisions_used: 3,
      status: "completed",
      share_id: "d4b2e1f8c6a0e9b2"
    },
    {
      id: "proj_3",
      freelancer_id: "usr_free_2",
      client_name: "Nova Ventures",
      project_name: "FinTech Pitch Deck",
      total_revisions_allowed: 4,
      current_revisions_used: 1,
      status: "active",
      share_id: "8c7d6e5f4a3b2c10"
    }
  ]);

  const [revisions, setRevisions] = useState<Revision[]>([
    {
      id: "rev_1",
      project_id: "proj_1",
      revision_body: "Please make the hero header font bold and change the primary call-to-action button color from orange to indigo (#4F46E5) to match our branding.",
      freelancer_comment: "Done! Updated the CSS variables in the root style block.",
      status: "completed",
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    },
    {
      id: "rev_2",
      project_id: "proj_1",
      revision_body: "The testimonials section looks a bit crowded on mobile viewports. Can we stack the testimonial cards vertically on screens smaller than 768px?",
      freelancer_comment: "Fixed. Added mobile flex-col behavior to the card grid container.",
      status: "completed",
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    },
    {
      id: "rev_3",
      project_id: "proj_3",
      revision_body: "Slide 4 pricing values are incorrect. Standard tier is $49/mo, not $59/mo.",
      freelancer_comment: "Working on this, will update the PDF bundle shortly.",
      status: "reviewed",
      created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    }
  ]);

  const [databaseLogs, setDatabaseLogs] = useState<DatabaseLog[]>([
    { id: "log_1", timestamp: new Date(Date.now() - 50000).toLocaleTimeString(), type: "auth_trigger", message: "SYSTEM: Trigger 'on_auth_user_created' initialized. Listening to public auth signup events." },
    { id: "log_2", timestamp: new Date(Date.now() - 40000).toLocaleTimeString(), type: "rls_pass", message: "RLS POLICY: Row Level Security active for tables 'rev_profiles', 'rev_projects', and 'rev_revisions'." },
    { id: "log_3", timestamp: new Date(Date.now() - 20000).toLocaleTimeString(), type: "query", message: "SELECT public.rev_profiles: Found default simulation user profiles." }
  ]);

  // Log function helper
  const addLog = (type: DatabaseLog["type"], message: string) => {
    const newLog: DatabaseLog = {
      id: uuid(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setDatabaseLogs(prev => [newLog, ...prev]);
  };

  // State for creating profile
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileEmail, setNewProfileEmail] = useState("");
  const [showSignupForm, setShowSignupForm] = useState(false);

  // State for creating project
  const [newClientName, setNewClientName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newRevisionsAllowed, setNewRevisionsAllowed] = useState(3);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  // State for clients
  const [clientShareId, setClientShareId] = useState("");
  const [clientSearchedProjectId, setClientSearchedProjectId] = useState<string | null>(null);
  const [clientSearchAttempted, setClientSearchAttempted] = useState(false);
  const [newRevisionBody, setNewRevisionBody] = useState("");

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // ==========================================
  // LIVE SUPABASE DATABASE HANDLERS
  // ==========================================
  
  // Fetch live rows from Supabase
  const fetchLiveDatabaseData = async (clientInstance = liveClient) => {
    if (!clientInstance) return;
    addLog("query", "SELECT FROM public.rev_profiles, rev_projects, rev_revisions (live query)");
    try {
      const { data: { user } } = await clientInstance.auth.getUser();
      setLiveSessionUser(user);

      if (user) {
        // Fetch profiles
        const { data: pData, error: pErr } = await clientInstance.from("rev_profiles").select("*");
        if (pErr) {
          addLog("rls_fail", `[LIVE DB] Failed to select profiles: ${pErr.message}`);
        } else if (pData) {
          setLiveProfiles(pData);
        }

        // Fetch projects
        const { data: projData, error: projErr } = await clientInstance.from("rev_projects").select("*");
        if (projErr) {
          addLog("rls_fail", `[LIVE DB] Failed to select projects: ${projErr.message}`);
        } else if (projData) {
          setLiveProjects(projData);
          addLog("rls_pass", `[RLS GRANTED] Live profiles & projects retrieved successfully under your active user session.`);
        }

        // Fetch revisions
        const { data: revData, error: revErr } = await clientInstance.from("rev_revisions").select("*");
        if (revErr) {
          addLog("rls_fail", `[LIVE DB] Failed to select revisions: ${revErr.message}`);
        } else if (revData) {
          setLiveRevisions(revData);
        }
      } else {
        setLiveProfiles([]);
        setLiveProjects([]);
        setLiveRevisions([]);
      }
    } catch (e: any) {
      addLog("rls_fail", `[CONNECTION ERROR] Live DB fetch error: ${e.message}`);
    }
  };

  // Sync state on mode change or interval
  useEffect(() => {
    if (dbMode === "live" && liveClient) {
      fetchLiveDatabaseData(liveClient);
      const interval = setInterval(() => {
        fetchLiveDatabaseData(liveClient);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [dbMode, liveClient]);

  // Client search in live mode via share_id
  const handleClientSearchLive = async (shareIdToSearch: string, clientInstance = liveClient) => {
    if (!clientInstance) return;
    setClientSearchAttempted(true);
    addLog("query", `SELECT FROM public.rev_projects WHERE share_id = '${shareIdToSearch}' AS ROLE 'anon' (live query)`);
    try {
      const { data, error } = await clientInstance
        .from("rev_projects")
        .select("*")
        .eq("share_id", shareIdToSearch);

      if (error) {
        addLog("rls_fail", `[RLS BLOCKED / ERROR] SELECT on live rev_projects failed: ${error.message}`);
        setClientSearchedProjectId(null);
        return;
      }

      if (data && data.length > 0) {
        const matchedProj = data[0];
        addLog("rls_pass", `[RLS GRANTED] Found project '${matchedProj.project_name}' on live database! share_id matched SELECT policy.`);
        setLiveProjects(prev => {
          const filtered = prev.filter(p => p.id !== matchedProj.id);
          return [...filtered, matchedProj];
        });
        setClientSearchedProjectId(matchedProj.id);

        // Fetch revisions for this project
        addLog("query", `SELECT FROM public.rev_revisions WHERE project_id = '${matchedProj.id}' AS ROLE 'anon' (live query)`);
        const { data: revs, error: revErr } = await clientInstance
          .from("rev_revisions")
          .select("*")
          .eq("project_id", matchedProj.id);

        if (revErr) {
          addLog("rls_fail", `[RLS BLOCKED / ERROR] SELECT on live rev_revisions failed: ${revErr.message}`);
        } else if (revs) {
          addLog("rls_pass", `[RLS GRANTED] Retrieved ${revs.length} live revision request(s) for this project.`);
          setLiveRevisions(prev => {
            const filtered = prev.filter(r => r.project_id !== matchedProj.id);
            return [...filtered, ...revs];
          });
        }
      } else {
        addLog("rls_fail", `[RLS BLOCKED] Live SELECT returned 0 rows. Make sure the table exists, and your share_id is valid.`);
        setClientSearchedProjectId(null);
      }
    } catch (e: any) {
      addLog("rls_fail", `[LIVE ERROR] Client portal fetch failed: ${e.message}`);
      setClientSearchedProjectId(null);
    }
  };

  // Create Project Live
  const handleCreateProjectLive = async (e: FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newProjectName || !liveClient || !liveSessionUser) return;

    addLog("query", `INSERT INTO public.rev_projects FOR USER '${liveSessionUser.id}' (live query)`);
    try {
      const newShareId = randomHex();
      const newProjPayload = {
        freelancer_id: liveSessionUser.id,
        client_name: newClientName,
        project_name: newProjectName,
        total_revisions_allowed: newRevisionsAllowed,
        current_revisions_used: 0,
        status: "active" as const,
        share_id: newShareId
      };

      const { data, error } = await liveClient
        .from("rev_projects")
        .insert([newProjPayload])
        .select();

      if (error) {
        addLog("rls_fail", `[RLS BLOCKED / ERROR] INSERT into public.rev_projects failed: ${error.message}`);
        alert(`Insertion failed: ${error.message}. Make sure the rev_projects table is created and policies are configured.`);
      } else if (data && data.length > 0) {
        addLog("rls_pass", `[RLS GRANTED] Project inserted successfully! ID: ${data[0].id}`);
        setLiveProjects(prev => [...prev, data[0]]);
        setShowNewProjectForm(false);
        setNewClientName("");
        setNewProjectName("");
        setNewRevisionsAllowed(3);
        addLog("insert", `[INSERT SUCCESS] Created project '${newProjectName}' live in Supabase.`);
      }
    } catch (err: any) {
      addLog("rls_fail", `[LIVE ERROR] Project creation error: ${err.message}`);
    }
  };

  // Submit Revision Live
  const handleRequestRevisionLive = async (e: FormEvent, projectId: string) => {
    e.preventDefault();
    if (!newRevisionBody.trim() || !liveClient) return;

    const targetProject = liveProjects.find(p => p.id === projectId);
    if (!targetProject) return;

    addLog("query", `INSERT INTO public.rev_revisions FOR project_id '${projectId}' AS ROLE 'anon' (live query)`);
    try {
      const newRevPayload = {
        project_id: projectId,
        revision_body: newRevisionBody,
        freelancer_comment: "",
        status: "pending" as const
      };

      const { data, error } = await liveClient
        .from("rev_revisions")
        .insert([newRevPayload])
        .select();

      if (error) {
        addLog("rls_fail", `[RLS BLOCKED / ERROR] INSERT into public.rev_revisions failed: ${error.message}`);
        alert(`Insertion failed: ${error.message}`);
      } else if (data && data.length > 0) {
        addLog("rls_pass", `[RLS GRANTED] Revision requested live in Supabase! ID: ${data[0].id}`);
        setLiveRevisions(prev => [...prev, data[0]]);
        setLiveProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            return { ...p, current_revisions_used: p.current_revisions_used + 1 };
          }
          return p;
        }));
        setNewRevisionBody("");
        addLog("insert", `[INSERT SUCCESS] Live revision request submitted.`);
      }
    } catch (err: any) {
      addLog("rls_fail", `[LIVE ERROR] Revision submit error: ${err.message}`);
    }
  };

  // Update Revision Status Live
  const handleUpdateRevisionStatusLive = async (revisionId: string, status: Revision["status"], comment: string) => {
    if (!liveClient) return;
    addLog("query", `UPDATE public.rev_revisions SET status = '${status}' WHERE id = '${revisionId}' (live query)`);
    try {
      const { data, error } = await liveClient
        .from("rev_revisions")
        .update({ status, freelancer_comment: comment })
        .eq("id", revisionId)
        .select();

      if (error) {
        addLog("rls_fail", `[RLS BLOCKED / ERROR] UPDATE public.rev_revisions failed: ${error.message}`);
      } else if (data && data.length > 0) {
        addLog("rls_pass", `[RLS GRANTED] UPDATE allowed. You own the parent project.`);
        setLiveRevisions(prev => prev.map(r => {
          if (r.id === revisionId) {
            return { ...r, status, freelancer_comment: comment };
          }
          return r;
        }));
        addLog("update", `[UPDATE SUCCESS] Live status updated to '${status}' with remarks.`);
      }
    } catch (err: any) {
      addLog("rls_fail", `[LIVE ERROR] Revision status update failed: ${err.message}`);
    }
  };

  // Toggle Project Status Live
  const handleToggleProjectStatusLive = async (projectId: string, currentStatus: "active" | "completed") => {
    if (!liveClient) return;
    const nextStatus = currentStatus === "active" ? "completed" : "active";
    addLog("query", `UPDATE public.rev_projects SET status = '${nextStatus}' WHERE id = '${projectId}' (live query)`);
    try {
      const { data, error } = await liveClient
        .from("rev_projects")
        .update({ status: nextStatus })
        .eq("id", projectId)
        .select();

      if (error) {
        addLog("rls_fail", `[RLS BLOCKED / ERROR] UPDATE public.rev_projects failed: ${error.message}`);
      } else if (data && data.length > 0) {
        addLog("rls_pass", `[RLS GRANTED] UPDATE allowed. You own the project.`);
        setLiveProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            return { ...p, status: nextStatus };
          }
          return p;
        }));
        addLog("update", `[UPDATE SUCCESS] Live status changed to '${nextStatus}'.`);
      }
    } catch (err: any) {
      addLog("rls_fail", `[LIVE ERROR] Project status update failed: ${err.message}`);
    }
  };

  // Live Authentication Handlers
  const handleLiveSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !liveClient) return;
    setIsAuthLoading(true);
    addLog("query", `auth.signUp(email: '${authEmail}') ON LIVE DB`);
    try {
      const { data, error } = await liveClient.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            business_name: authBusinessName || "My Freelance Studio"
          }
        }
      });

      if (error) {
        addLog("rls_fail", `[AUTH SIGNUP FAILED] ${error.message}`);
        alert(`Signup failed: ${error.message}`);
      } else {
        addLog("auth_trigger", `[LIVE SIGNUP SUCCESS] User created in auth.users (ID: ${data.user?.id || "pending"})`);
        addLog("auth_trigger", `Your Supabase on_auth_user_created trigger automatically runs public.handle_new_user() using definer status.`);
        setLiveSessionUser(data.user);
        setAuthBusinessName("");
        setAuthPassword("");
        setTimeout(() => {
          fetchLiveDatabaseData(liveClient);
        }, 1500);
      }
    } catch (err: any) {
      addLog("rls_fail", `[LIVE AUTH ERROR] Signup error: ${err.message}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLiveSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !liveClient) return;
    setIsAuthLoading(true);
    addLog("query", `auth.signInWithPassword(email: '${authEmail}') ON LIVE DB`);
    try {
      const { data, error } = await liveClient.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (error) {
        addLog("rls_fail", `[AUTH SIGNIN FAILED] ${error.message}`);
        alert(`Sign in failed: ${error.message}`);
      } else {
        addLog("rls_pass", `[LIVE AUTH SUCCESS] Authenticated as user ID: ${data.user?.id}`);
        setLiveSessionUser(data.user);
        setAuthPassword("");
        fetchLiveDatabaseData(liveClient);
      }
    } catch (err: any) {
      addLog("rls_fail", `[LIVE AUTH ERROR] Sign in error: ${err.message}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLiveSignOut = async () => {
    if (!liveClient) return;
    addLog("query", "auth.signOut() ON LIVE DB");
    try {
      await liveClient.auth.signOut();
      setLiveSessionUser(null);
      setLiveProfiles([]);
      setLiveProjects([]);
      setLiveRevisions([]);
      addLog("rls_pass", "Sign out successful. Cleared live database session state.");
    } catch (err: any) {
      addLog("rls_fail", `Sign out error: ${err.message}`);
    }
  };

  // Save Supabase Config Changes
  const handleSaveConfig = (e: FormEvent) => {
    e.preventDefault();
    setIsConfigSaving(true);
    try {
      localStorage.setItem("rev_supabase_url", supabaseUrl);
      localStorage.setItem("rev_supabase_key", supabaseKey);
      
      const newClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
      setLiveClient(newClient);
      addLog("rls_pass", `Re-initialized live client to point to: ${supabaseUrl}`);
      
      setTimeout(() => {
        fetchLiveDatabaseData(newClient);
        setIsConfigSaving(false);
        setShowConfigPanel(false);
      }, 1000);
    } catch (err: any) {
      addLog("rls_fail", `Config failed to instantiate client: ${err.message}`);
      setIsConfigSaving(false);
    }
  };

  // Signup simulation (triggering auth trigger simulation)
  const handleSimulateSignup = (e: FormEvent) => {
    e.preventDefault();
    if (!newProfileName || !newProfileEmail) return;

    const newUserId = "usr_" + uuid().substring(0, 8);
    const newProfile: Profile = {
      id: newUserId,
      business_name: newProfileName,
      email: newProfileEmail
    };

    // 1. Simulate Auth.Users insertion
    addLog("auth_trigger", `[AUTH.USERS SIGNUP] New user registers in auth.users: email = ${newProfileEmail}`);
    
    // 2. Simulate Trigger execution
    setTimeout(() => {
      addLog("auth_trigger", `[TRIGGER EXECUTED] Trigger 'on_auth_user_created' fires. Invoking public.handle_new_user() with security definer rules.`);
      setProfiles(prev => [...prev, newProfile]);
      setActiveProfileId(newUserId);
      setShowSignupForm(false);
      setNewProfileName("");
      setNewProfileEmail("");
      addLog("insert", `[TRIGGER INSERT SUCCESS] Automatically inserted 1 row into public.rev_profiles (id: ${newUserId}, business_name: '${newProfileName}')`);
    }, 400);
  };

  // Create Project Simulation
  const handleCreateProject = (e: FormEvent) => {
    e.preventDefault();
    if (dbMode === "live") {
      handleCreateProjectLive(e);
      return;
    }
    if (!newClientName || !newProjectName) return;

    const newProjId = "proj_" + uuid().substring(0, 8);
    const newShareId = randomHex();

    const newProj: Project = {
      id: newProjId,
      freelancer_id: activeProfileId,
      client_name: newClientName,
      project_name: newProjectName,
      total_revisions_allowed: newRevisionsAllowed,
      current_revisions_used: 0,
      status: "active",
      share_id: newShareId
    };

    // Log RLS verification
    addLog("query", `INSERT INTO public.rev_projects FOR USER '${activeProfileId}'`);
    
    setTimeout(() => {
      addLog("rls_pass", `[RLS GRANTED] INSERT policy "Freelancers can manage their own projects" matched. user_id (${activeProfileId}) = freelancer_id.`);
      setProjects(prev => [...prev, newProj]);
      setShowNewProjectForm(false);
      setNewClientName("");
      setNewProjectName("");
      setNewRevisionsAllowed(3);
      addLog("insert", `[INSERT SUCCESS] Project '${newProjectName}' successfully created (ID: ${newProjId}, share_id: ${newShareId})`);
    }, 300);
  };

  // Client views project via share link
  const handleClientSearch = (shareIdToSearch: string) => {
    if (dbMode === "live") {
      handleClientSearchLive(shareIdToSearch);
      return;
    }
    setClientSearchAttempted(true);
    addLog("query", `SELECT FROM public.rev_projects WHERE share_id = '${shareIdToSearch}' AS ROLE 'anon'`);

    const matchedProj = projects.find(p => p.share_id === shareIdToSearch);

    setTimeout(() => {
      if (matchedProj) {
        addLog("rls_pass", `[RLS GRANTED] SELECT on 'rev_projects' allowed. Anonymous viewer queried valid share_id. Found 1 row.`);
        setClientSearchedProjectId(matchedProj.id);
      } else {
        addLog("rls_fail", `[RLS BLOCKED] SELECT on 'rev_projects' denied or returned empty. No match found for share_id = '${shareIdToSearch}'. Access Denied.`);
        setClientSearchedProjectId(null);
      }
    }, 300);
  };

  // Client requests new revision
  const handleRequestRevision = (e: FormEvent, projectId: string) => {
    e.preventDefault();
    if (dbMode === "live") {
      handleRequestRevisionLive(e, projectId);
      return;
    }
    if (!newRevisionBody.trim()) return;

    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    if (targetProject.status === "completed") {
      addLog("rls_fail", `[RLS BLOCKED] INSERT into rev_revisions failed. Project is marked as completed. Policy requires status = 'active'.`);
      alert("This project is completed. Revisions can no longer be submitted.");
      return;
    }

    if (targetProject.current_revisions_used >= targetProject.total_revisions_allowed) {
      addLog("update", `[CONSTRAINT WARNING] Revision limit reached (${targetProject.total_revisions_allowed}/${targetProject.total_revisions_allowed}). Client requested extra review.`);
    }

    const newRevId = "rev_" + uuid().substring(0, 8);
    const newRev: Revision = {
      id: newRevId,
      project_id: projectId,
      revision_body: newRevisionBody,
      freelancer_comment: "",
      status: "pending",
      created_at: new Date().toISOString()
    };

    addLog("query", `INSERT INTO public.rev_revisions FOR project_id '${projectId}' AS ROLE 'anon'`);

    setTimeout(() => {
      addLog("rls_pass", `[RLS GRANTED] INSERT on 'rev_revisions' allowed. Anonymous user verified parent project is active.`);
      
      // Update state: Add revision & increment count
      setRevisions(prev => [...prev, newRev]);
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return { ...p, current_revisions_used: p.current_revisions_used + 1 };
        }
        return p;
      }));

      setNewRevisionBody("");
      addLog("insert", `[INSERT SUCCESS] New revision requested. Increased current_revisions_used counter.`);
    }, 300);
  };

  // Freelancer updates revision status
  const handleUpdateRevisionStatus = (revisionId: string, status: Revision["status"], comment: string) => {
    if (dbMode === "live") {
      handleUpdateRevisionStatusLive(revisionId, status, comment);
      return;
    }
    addLog("query", `UPDATE public.rev_revisions SET status = '${status}' WHERE id = '${revisionId}'`);

    setTimeout(() => {
      addLog("rls_pass", `[RLS GRANTED] UPDATE on 'rev_revisions' allowed. Freelancer owns the parent project.`);
      setRevisions(prev => prev.map(r => {
        if (r.id === revisionId) {
          return { ...r, status, freelancer_comment: comment };
        }
        return r;
      }));
      addLog("update", `[UPDATE SUCCESS] Revision status changed to '${status}'. Comment updated.`);
    }, 250);
  };

  // Freelancer updates project status
  const handleToggleProjectStatus = (projectId: string, currentStatus: "active" | "completed") => {
    if (dbMode === "live") {
      handleToggleProjectStatusLive(projectId, currentStatus);
      return;
    }
    const nextStatus = currentStatus === "active" ? "completed" : "active";
    addLog("query", `UPDATE public.rev_projects SET status = '${nextStatus}' WHERE id = '${projectId}'`);

    setTimeout(() => {
      addLog("rls_pass", `[RLS GRANTED] UPDATE allowed. authenticated freelancer ID owns project.`);
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return { ...p, status: nextStatus };
        }
        return p;
      }));
      addLog("update", `[UPDATE SUCCESS] Project status set to '${nextStatus}'.`);
    }, 250);
  };

  // Filter projects belonging to active profile
  const activeFreelancer = dbMode === "live"
    ? (liveSessionUser ? (liveProfiles.find(p => p.id === liveSessionUser.id) || { id: liveSessionUser.id, business_name: liveSessionUser.user_metadata?.business_name || "Active Freelancer", email: liveSessionUser.email || "freelancer@live.com" }) : null)
    : (activeProfileId ? profiles.find(p => p.id === activeProfileId) : null);

  const isFreelancerLoggedIn = dbMode === "live" ? !!liveSessionUser : !!activeProfileId;
  const showWorkspace = isFreelancerLoggedIn || simulatorRole === "client";

  const freelancerProjects = dbMode === "live"
    ? (liveSessionUser ? liveProjects.filter(p => p.freelancer_id === liveSessionUser.id) : [])
    : (activeProfileId ? projects.filter(p => p.freelancer_id === activeProfileId) : []);

  const activeProjectForClient = dbMode === "live"
    ? liveProjects.find(p => p.id === clientSearchedProjectId)
    : projects.find(p => p.id === clientSearchedProjectId);

  const clientRevisions = dbMode === "live"
    ? liveRevisions.filter(r => r.project_id === clientSearchedProjectId)
    : revisions.filter(r => r.project_id === clientSearchedProjectId);

  // Quick action: switch roles and prefill share link
  const viewAsClient = (shareId: string) => {
    setSimulatorRole("client");
    setClientShareId(shareId);
    handleClientSearch(shareId);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans p-6 selection:bg-indigo-500/10 selection:text-indigo-600">
      
      {/* App Header */}
      <header className="relative max-w-7xl w-full mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 italic">
              REV<span className="text-indigo-600">-LIMIT</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              Supabase Multi-App Blueprint & RLS Sandbox
            </p>
          </div>
        </div>

        {/* Tab Controls & User info */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm shrink-0">
            <button
              id="tab-sql-schema"
              onClick={() => setCurrentTab("sql")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                currentTab === "sql"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              SQL Schema
            </button>
            <button
              id="tab-interactive-sandbox"
              onClick={() => {
                setCurrentTab("simulator");
                addLog("query", "INITIATING: Interactive playground launched.");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                currentTab === "simulator"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Live DB Simulator
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200">
            {activeFreelancer ? (
              <>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">{activeFreelancer.business_name}</p>
                  <p className="text-[10px] font-mono text-slate-400">{activeFreelancer.email}</p>
                </div>
                <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm">
                  {activeFreelancer.business_name.substring(0, 2).toUpperCase()}
                </div>
              </>
            ) : (
              <>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400">Guest Visitor</p>
                  <p className="text-[10px] font-mono text-slate-400">Not Authenticated</p>
                </div>
                <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs shadow-sm">
                  GV
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative max-w-7xl w-full mx-auto flex-1 flex flex-col">
        
        {/* Tab 1: SQL Schema & Explanation */}
        {currentTab === "sql" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2"
          >
            {/* Left: Code Block */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full">
                {/* Code Window Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-300" />
                    <span className="w-3 h-3 rounded-full bg-slate-200" />
                    <span className="w-3 h-3 rounded-full bg-indigo-200" />
                    <span className="ml-2 text-xs font-mono font-semibold text-slate-500 italic">rev_limit_schema.sql</span>
                  </div>
                  <button
                    id="copy-sql-btn"
                    onClick={() => copyToClipboard(SQL_SCRIPT)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-200/20 transition-all cursor-pointer"
                  >
                    {sqlCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy SQL Script
                      </>
                    )}
                  </button>
                </div>

                {/* SQL Code View */}
                <div className="p-6 overflow-y-auto max-h-[600px] font-mono text-xs text-zinc-300 leading-relaxed bg-slate-950 rounded-2xl m-4 border border-slate-900 shadow-inner">
                  <pre className="whitespace-pre">{SQL_SCRIPT}</pre>
                </div>
              </div>
            </div>

            {/* Right: Explanations */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-indigo-600" />
                  Supabase RLS Blueprint
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  Supabase runs on PostgreSQL and manages authorization at the row level. This script prefixes all tables with <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-indigo-600 font-mono font-bold">rev_</code> for multi-app setups and leverages built-in auth utilities for secure access.
                </p>

                {/* Explanation accordion cards */}
                <div className="space-y-4">
                  {EXPLANATION_SECTIONS.map((section, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        {section.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed pl-4">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions Callout */}
              <div className="p-5 bg-indigo-50/40 border border-indigo-100/50 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Ready to test?</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                      Click below or switch to the <strong>Live DB Simulator</strong> tab to interactively preview how these tables, triggers, and RLS policies behave in real-time!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentTab("simulator")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-100 shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  Launch Simulator
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Live Simulator Workspace */}
        {currentTab === "simulator" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6 mt-4"
          >
            {/* If Not Logged In and Freelancer, show Landing Page */}
            {!showWorkspace ? (
              <div className="flex flex-col gap-8 mt-2">
                {/* HERO BANNER SECTION */}
                <div className="relative bg-slate-900 text-white rounded-[32px] p-8 md:p-12 overflow-hidden shadow-2xl shadow-slate-950/20 border border-slate-800">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
                  
                  <div className="max-w-3xl relative z-10 flex flex-col gap-4">
                    <span className="self-start px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold tracking-widest rounded-full uppercase">
                      🚀 PostgreSQL RLS Sandbox Engine
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                      Protect Your Time. <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300">
                        Limit Infinite Client Revisions.
                      </span>
                    </h2>
                    <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                      Say goodbye to "just one more small change" requests that eat into your profit. 
                      <strong> REV-LIMIT</strong> enforces maximum revision caps per contract directly at the database layer using PostgreSQL Row-Level Security. Once the limit is hit, database triggers intercept and block further entries automatically!
                    </p>
                  </div>
                </div>

                {/* THREE VALUE PROP CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">RLS Constraint Enforcement</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Database security policies (RLS) inspect current revision counts before allowing INSERTs. Revisions are capped on a per-contract level safely.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                      <Eye className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">Zero-Auth Client Portal</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Clients access unique review links with anonymous SELECT/INSERT access. They cannot read or modify projects owned by other users.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">Real-Time Auditing logs</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Every single SELECT, UPDATE, or INSERT query shows in the real-time Postgres log, detailing exactly why a security policy allowed or denied it.
                    </p>
                  </div>
                </div>

                {/* DB MODE SELECTOR & AUTHENTICATION PORTAL */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
                  
                  {/* Mode Toggler */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-600" />
                        Configure Database Connection
                      </h3>
                      <p className="text-slate-500 text-xs mt-1">
                        Select Sandbox mode for an instant test, or Live mode to connect your real Supabase backend.
                      </p>
                    </div>

                    <div className="flex p-1 bg-slate-100 rounded-2xl w-full md:w-auto self-stretch">
                      <button
                        onClick={() => {
                          setDbMode("sandbox");
                          addLog("query", "SWITCHED ENGINE: Back to Local Sandbox Simulator");
                        }}
                        className={`flex-1 md:flex-none px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          dbMode === "sandbox"
                            ? "bg-slate-900 text-white shadow-md"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Option A: Sandbox Mode
                      </button>
                      <button
                        onClick={() => {
                          setDbMode("live");
                          addLog("query", "SWITCHED ENGINE: Connecting to Live Supabase Database");
                          fetchLiveDatabaseData();
                        }}
                        className={`flex-1 md:flex-none px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          dbMode === "live"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <DatabaseZap className="w-3.5 h-3.5" />
                        Option B: Live Supabase
                      </button>
                    </div>
                  </div>

                  {/* SANDBOX AUTH OPTIONS */}
                  {dbMode === "sandbox" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left side: Demo Accounts list */}
                      <div className="lg:col-span-6 flex flex-col gap-4">
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <User className="w-4 h-4 text-indigo-600" />
                          1-Click Demo Profiles
                        </h4>
                        <p className="text-slate-500 text-xs leading-relaxed">
                          Select one of the preloaded freelancer workspaces below. Signing in instantly unlocks the full dashboard and lets you query, manage, and share projects.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                          {profiles.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setActiveProfileId(p.id);
                                addLog("rls_pass", `Logged in as freelancer profile: '${p.business_name}'`);
                              }}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 p-4 rounded-2xl text-left transition-all hover:border-indigo-500/50 hover:shadow-md cursor-pointer flex flex-col justify-between h-28 group"
                            >
                              <div>
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  Freelancer Profile
                                </span>
                                <h5 className="font-bold text-slate-800 text-sm mt-2 group-hover:text-indigo-600 transition-colors">
                                  {p.business_name}
                                </h5>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5 break-all">
                                  {p.email}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 self-end mt-1">
                                Launch Dashboard
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right side: Sandbox user signup form simulation */}
                      <div className="lg:col-span-6 bg-slate-50 border border-slate-200/85 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <UserPlus className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Simulate Triggered Auth Sign-Up
                          </h4>
                        </div>
                        <p className="text-slate-500 text-xs leading-relaxed mb-4">
                          Type in a custom name and email to simulate a database trigger. Registered users automatically fire the <code className="px-1 bg-slate-200/50 text-[11px] font-mono rounded">on_auth_user_created</code> trigger, inserting a matching profile row into <code className="font-mono text-[11px] bg-slate-200/50 px-1">rev_profiles</code>!
                        </p>

                        <form onSubmit={handleSimulateSignup} className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Freelance Business Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Skyline Creative Agency"
                              value={newProfileName}
                              onChange={(e) => setNewProfileName(e.target.value)}
                              className="bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 w-full text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                            <input
                              type="email"
                              required
                              placeholder="designer@skyline.io"
                              value={newProfileEmail}
                              onChange={(e) => setNewProfileEmail(e.target.value)}
                              className="bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 w-full text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Trigger DB Signup & Sign In
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* LIVE SUPABASE AUTH OPTIONS */}
                  {dbMode === "live" && (
                    <div className="flex flex-col gap-6">
                      {/* Status and Edit button if already connected */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-100">
                            <DatabaseZap className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Connected to Live Supabase Project</p>
                            <p className="text-[10px] font-mono text-slate-500 break-all">{supabaseUrl}</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setShowConfigPanel(!showConfigPanel)}
                          className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer self-start sm:self-auto"
                        >
                          {showConfigPanel ? "Close Panel" : "Edit Credentials"}
                        </button>
                      </div>

                      {/* Config panel edit form */}
                      {showConfigPanel && (
                        <motion.form 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          onSubmit={handleSaveConfig}
                          className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-4"
                        >
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-indigo-600" />
                            Supabase Credentials Configuration
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Project URL</label>
                              <input
                                type="text"
                                required
                                value={supabaseUrl}
                                onChange={(e) => setSupabaseUrl(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 w-full text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Anon / Publishable Key</label>
                              <input
                                type="text"
                                required
                                value={supabaseKey}
                                onChange={(e) => setSupabaseKey(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 w-full text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={isConfigSaving}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center gap-1.5"
                            >
                              {isConfigSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Save & Connect"}
                            </button>
                          </div>
                        </motion.form>
                      )}

                      {/* Instructions and live signup/signin form */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Steps instructions */}
                        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-6">
                          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                            <Info className="w-4 h-4 text-indigo-600" />
                            Live Project Integration Guide
                          </h4>
                          
                          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                            <div className="flex gap-2.5">
                              <span className="w-5 h-5 bg-indigo-100 text-indigo-600 font-bold rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                              <div>
                                <p className="font-bold text-slate-800">Execute the SQL Schema Script</p>
                                <p className="text-slate-500 mt-0.5">
                                  Go to the <strong className="text-indigo-600">SQL Schema</strong> tab above, copy the complete script, run it in your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-bold hover:text-indigo-600 inline-flex items-center gap-0.5">Supabase SQL Editor <ExternalLink className="w-3 h-3" /></a> to setup tables, triggers and secure RLS.
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2.5">
                              <span className="w-5 h-5 bg-indigo-100 text-indigo-600 font-bold rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                              <div>
                                <p className="font-bold text-slate-800">Register / Create Live Freelancer Account</p>
                                <p className="text-slate-500 mt-0.5">
                                  Use the auth form on the right to sign up. Supabase will securely process your registration and run your trigger to automatically build your user profile record!
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2.5">
                              <span className="w-5 h-5 bg-indigo-100 text-indigo-600 font-bold rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                              <div>
                                <p className="font-bold text-slate-800">Experience Real Postgres RLS Magic</p>
                                <p className="text-slate-500 mt-0.5">
                                  Once signed in, any project creation, deletion, or revision limits are managed in your actual Postgres tables! Try testing invalid client links to see actual Postgres RLS blocks.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Real Auth form */}
                        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                              <User className="w-4 h-4 text-indigo-600" />
                              {isSigningUp ? "Create Live Account" : "Freelancer Sign In"}
                            </h4>
                            <button
                              onClick={() => setIsSigningUp(!isSigningUp)}
                              className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              {isSigningUp ? "Already have account?" : "Need an account?"}
                            </button>
                          </div>

                          <form onSubmit={isSigningUp ? handleLiveSignUp : handleLiveSignIn} className="space-y-3">
                            {isSigningUp && (
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Business Name</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Acme Creative Agency"
                                  value={authBusinessName}
                                  onChange={(e) => setAuthBusinessName(e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 w-full text-slate-800 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                              <input
                                type="email"
                                required
                                placeholder="you@example.com"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 w-full text-slate-800 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                              <input
                                type="password"
                                required
                                minLength={6}
                                placeholder="••••••••"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 w-full text-slate-800 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isAuthLoading}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100"
                            >
                              {isAuthLoading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  {isSigningUp ? <UserPlus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                  {isSigningUp ? "Register & Connect" : "Authenticate Session"}
                                </>
                              )}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BOTTOM GATEWAY TO CLIENT PORTAL */}
                  <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Eye className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Testing as a Client?</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Skip freelancer registration. Enter a project share key directly in the public client portal to experience row-level query protection.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSimulatorRole("client");
                        addLog("query", "CLIENT PORTAL: Accessing public-facing dashboard.");
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer shadow-md shadow-indigo-100 flex items-center gap-1"
                    >
                      Launch Client Portal
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              <>
                  {/* Simulation Header Menu / State Bar */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Simulation Role:
                      </span>
                      
                      <button
                        id="role-freelancer-btn"
                        onClick={() => setSimulatorRole("freelancer")}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          simulatorRole === "freelancer"
                            ? "bg-slate-900 text-white shadow-md"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        Freelancer Workspace
                      </button>

                      <button
                        id="role-client-btn"
                        onClick={() => setSimulatorRole("client")}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          simulatorRole === "client"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Public Client Portal (Anon)
                      </button>
                    </div>

                    {/* Freelancer Profile Switcher (Only visible to freelancer mode) */}
                    {simulatorRole === "freelancer" && (
                      <div className="flex items-center gap-2.5">
                        {dbMode === "live" ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-slate-700 font-mono bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                              Session: {liveSessionUser?.email}
                            </span>
                            <button
                              onClick={handleLiveSignOut}
                              className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 text-xs font-bold rounded-xl border border-rose-100 transition-all cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Sign Out
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-slate-500 shrink-0">Logged Freelancer:</span>
                            <select
                              id="freelancer-session-select"
                              value={activeProfileId}
                              onChange={(e) => {
                                setActiveProfileId(e.target.value);
                                addLog("query", `Switched active session to freelancer ID: ${e.target.value}`);
                              }}
                              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              <option value="" disabled>-- Select Profile --</option>
                              {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.business_name} ({p.email})</option>
                              ))}
                            </select>

                            <button
                              id="show-signup-form-btn"
                              onClick={() => setShowSignupForm(true)}
                              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 text-xs font-bold rounded-xl border border-indigo-200/30 transition-all cursor-pointer"
                              title="Simulate a new auth.users signup and check if the database trigger inserts a profile"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              New Signup
                            </button>

                            <button
                              onClick={() => {
                                setActiveProfileId("");
                                addLog("rls_pass", "Logged out of Sandbox. Returned to Landing Page.");
                              }}
                              className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 text-xs font-bold rounded-xl border border-rose-100 transition-all cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Sign Out
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Client Portal Search Bar */}
                    {simulatorRole === "client" && (
                <div className="flex items-center gap-2 w-full md:w-auto max-w-md">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      id="client-share-id-input"
                      type="text"
                      placeholder="Enter Project share_id..."
                      value={clientShareId}
                      onChange={(e) => setClientShareId(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 w-full text-slate-800 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
                    />
                  </div>
                  <button
                    id="client-search-submit"
                    onClick={() => handleClientSearch(clientShareId)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-md shadow-indigo-100"
                  >
                    Query DB
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats Bento Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-1">
              
              {/* Card 1: Active Projects */}
              <div className="col-span-1 md:col-span-3 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm min-h-[140px]">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Projects</p>
                <div>
                  <h2 className="text-4xl font-bold text-slate-800 font-mono">
                    {projects.filter(p => p.status === 'active').length}
                  </h2>
                  <p className="text-emerald-600 text-[10px] font-semibold mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live in system
                  </p>
                </div>
              </div>

              {/* Card 2: Rev-Limit Reached */}
              <div className="col-span-1 md:col-span-3 bg-indigo-600 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-indigo-100 min-h-[140px]">
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Rev-Limit Reached</p>
                <div>
                  <h2 className="text-4xl font-bold text-white font-mono">
                    {projects.filter(p => p.current_revisions_used >= p.total_revisions_allowed).length}
                  </h2>
                  <p className="text-indigo-200 text-[10px] mt-1">Requires upgrade action</p>
                </div>
              </div>

              {/* Card 3: rev_usage_metrics bar chart */}
              <div className="col-span-1 md:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm min-h-[140px] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider italic font-mono">rev_usage_metrics</p>
                  <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600 uppercase tracking-widest">Realtime</span>
                </div>
                
                {/* Simulated vertical bar columns representing active projects' revision usage */}
                <div className="flex items-end gap-2.5 h-14 pt-1">
                  {projects.length === 0 ? (
                    <div className="w-full text-center text-[10px] text-slate-400 font-mono pb-2">
                      Waiting for projects...
                    </div>
                  ) : (
                    projects.map((p, idx) => {
                      const percentage = Math.min(100, Math.round((p.current_revisions_used / p.total_revisions_allowed) * 100));
                      // Scale height dynamically between 10% and 100%
                      const heightStyle = { height: `${Math.max(15, percentage)}%` };
                      const isLimitReached = p.current_revisions_used >= p.total_revisions_allowed;
                      
                      return (
                        <div key={p.id} className="flex-1 flex flex-col items-center group relative h-full justify-end" id={`bar-metric-${p.id}`}>
                          <div 
                            style={heightStyle} 
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              isLimitReached ? 'bg-rose-500 shadow-sm shadow-rose-200' : 'bg-indigo-600'
                            }`}
                          />
                          <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-30 font-mono">
                            {p.project_name}: {p.current_revisions_used}/{p.total_revisions_allowed} revs
                          </div>
                          <span className="text-[8px] text-slate-400 font-mono mt-1 select-none">P{idx + 1}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Sandbox Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Main Interaction Screen (Col 1-8) */}
              <div className="lg:col-span-8 flex flex-col gap-6">

                 {/* Sign up Modal / Form Overlay inside Sandbox */}
                {showSignupForm && simulatorRole === "freelancer" && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-md font-bold text-slate-800">Simulate Auth Signup Trigger</h3>
                      </div>
                      <button 
                        onClick={() => setShowSignupForm(false)} 
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      By registering a new user in the Supabase Authentication dashboard, a database trigger automatically invokes <code className="px-1 py-0.5 bg-slate-100 rounded text-indigo-600 font-semibold font-mono">handle_new_user()</code> to create a corresponding entry in <code className="px-1 py-0.5 bg-slate-100 rounded text-indigo-600 font-semibold font-mono">rev_profiles</code> with <code className="text-indigo-600">security definer</code> privileges. Try it now!
                    </p>
                    <form onSubmit={handleSimulateSignup} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 font-semibold mb-1">Business/Freelancer Name</label>
                        <input
                          id="signup-business-name"
                          type="text"
                          required
                          placeholder="e.g. Lunar Pixel LLC"
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 w-full text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 font-semibold mb-1">Email Address</label>
                        <input
                          id="signup-email"
                          type="email"
                          required
                          placeholder="e.g. design@lunar.com"
                          value={newProfileEmail}
                          onChange={(e) => setNewProfileEmail(e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 w-full text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                        <button
                          id="signup-submit"
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-100"
                        >
                          Register User & Trigger Profile Build
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* ROLE A: FREELANCER PANELS */}
                {simulatorRole === "freelancer" && !showSignupForm && (
                  <div className="flex flex-col gap-6">
                    {/* Projects Listing Card */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className="w-5 h-5 text-indigo-600" />
                          <h3 className="text-md font-bold text-slate-800">
                            Projects List ({activeFreelancer?.business_name})
                          </h3>
                        </div>
                        <button
                          id="new-project-btn"
                          onClick={() => setShowNewProjectForm(!showNewProjectForm)}
                          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          New Project
                        </button>
                      </div>

                      {/* New Project Form (Collapsible) */}
                      <AnimatePresence>
                        {showNewProjectForm && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-b border-slate-100 bg-slate-50/40"
                          >
                            <form onSubmit={handleCreateProject} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-slate-500 font-semibold mb-1">Project Name</label>
                                  <input
                                    id="new-project-name"
                                    type="text"
                                    required
                                    placeholder="e.g. Website Overhaul"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="bg-white border border-slate-200 text-xs rounded-xl p-2.5 w-full text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-500 font-semibold mb-1">Client Name</label>
                                  <input
                                    id="new-client-name"
                                    type="text"
                                    required
                                    placeholder="e.g. Acme Corp"
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    className="bg-white border border-slate-200 text-xs rounded-xl p-2.5 w-full text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Max Revisions Allowed</label>
                                <input
                                  id="new-revisions-count"
                                  type="number"
                                  min="1"
                                  max="20"
                                  required
                                  value={newRevisionsAllowed}
                                  onChange={(e) => setNewRevisionsAllowed(parseInt(e.target.value))}
                                  className="bg-white border border-slate-200 text-xs rounded-xl p-2.5 w-full text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                                />
                              </div>
                              <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setShowNewProjectForm(false)}
                                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  id="create-project-submit"
                                  type="submit"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                                >
                                  Create & Apply RLS Policy
                                </button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Projects Table */}
                      <div className="overflow-x-auto">
                        {freelancerProjects.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                            No projects found for this freelancer. Click "New Project" to apply schema constraints.
                          </div>
                        ) : (
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                                <th className="p-4">Project Name</th>
                                <th className="p-4">Client</th>
                                <th className="p-4 text-center">Revisions Used</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Share Token</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {freelancerProjects.map(proj => {
                                const ratio = proj.current_revisions_used / proj.total_revisions_allowed;
                                const isWarning = ratio >= 1.0;
                                return (
                                  <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-semibold text-slate-800">{proj.project_name}</td>
                                    <td className="p-4 text-slate-500">{proj.client_name}</td>
                                    <td className="p-4">
                                      <div className="flex flex-col items-center gap-1 justify-center">
                                        <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-lg ${
                                          isWarning ? "text-rose-600 bg-rose-50 border border-rose-100" : "text-emerald-600 bg-emerald-50 border border-emerald-100"
                                        }`}>
                                          {proj.current_revisions_used} / {proj.total_revisions_allowed}
                                        </span>
                                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full ${isWarning ? "bg-rose-500" : "bg-emerald-500"}`} 
                                            style={{ width: `${Math.min(ratio * 100, 100)}%` }} 
                                          />
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <button
                                        onClick={() => handleToggleProjectStatus(proj.id, proj.status)}
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer border transition-all ${
                                          proj.status === "active"
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                        }`}
                                        title="Click to toggle project status (RLS restriction test)"
                                      >
                                        {proj.status}
                                      </button>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-1.5 font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 max-w-[120px] overflow-hidden text-[10px]" title={proj.share_id}>
                                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="truncate">{proj.share_id}</span>
                                      </div>
                                    </td>
                                    <td className="p-4 text-right">
                                      <button
                                        id={`view-client-${proj.id}`}
                                        onClick={() => viewAsClient(proj.share_id)}
                                        className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/50 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                                      >
                                        Client Portal
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                     {/* Revisions Board for Active Freelancer */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                      <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Terminal className="w-5 h-5 text-indigo-600" />
                        Revisions Inbound Queue
                      </h3>

                      <div className="space-y-4">
                        {revisions.filter(r => projects.some(p => p.id === r.project_id && p.freelancer_id === activeProfileId)).length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs font-semibold border border-slate-200 border-dashed rounded-2xl">
                            No revisions submitted yet. Share a project link with a client and simulate their submission!
                          </div>
                        ) : (
                          revisions
                            .filter(r => projects.some(p => p.id === r.project_id && p.freelancer_id === activeProfileId))
                            .map(rev => {
                              const parentProj = projects.find(p => p.id === rev.project_id)!;
                              return (
                                <div key={rev.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                                        {parentProj.project_name}
                                      </span>
                                      <span className="text-slate-400 text-[10px] font-mono">
                                        Submitted {new Date(rev.created_at).toLocaleString()}
                                      </span>
                                      
                                      {/* Revision Status Badge */}
                                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase border ${
                                        rev.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-200/50" :
                                        rev.status === "reviewed" ? "bg-blue-50 text-blue-600 border-blue-200/50" :
                                        rev.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200/50" :
                                        "bg-rose-50 text-rose-600 border-rose-200/50"
                                      }`}>
                                        {rev.status}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 font-mono">
                                      {rev.revision_body}
                                    </p>

                                    {/* Comments section */}
                                    <div className="mt-3">
                                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                                        Your remarks (Freelancer Comment)
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Add comment (e.g. Completed page styling update)"
                                        defaultValue={rev.freelancer_comment}
                                        onBlur={(e) => handleUpdateRevisionStatus(rev.id, rev.status, e.target.value)}
                                        className="bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 w-full text-slate-800 focus:outline-none focus:border-indigo-500 font-mono shadow-sm"
                                      />
                                    </div>
                                  </div>

                                  {/* Quick Action buttons */}
                                  <div className="flex flex-col gap-1.5 shrink-0 min-w-[120px]">
                                    <button
                                      id={`btn-reviewed-${rev.id}`}
                                      onClick={() => handleUpdateRevisionStatus(rev.id, "reviewed", rev.freelancer_comment)}
                                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/50 text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer"
                                    >
                                      Mark Reviewed
                                    </button>
                                    <button
                                      id={`btn-completed-${rev.id}`}
                                      onClick={() => handleUpdateRevisionStatus(rev.id, "completed", rev.freelancer_comment)}
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/50 text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer"
                                    >
                                      Mark Completed
                                    </button>
                                    <button
                                      id={`btn-canceled-${rev.id}`}
                                      onClick={() => handleUpdateRevisionStatus(rev.id, "canceled", rev.freelancer_comment)}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer"
                                    >
                                      Decline / Cancel
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                )}


                {/* ROLE B: PUBLIC CLIENT PORTAL */}
                {simulatorRole === "client" && (
                  <div className="flex flex-col gap-6">
                    {!clientSearchAttempted ? (
                      /* Zero-state instruction screen */
                      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-sm">
                        <Lock className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">Client Portal Access Restrained by RLS</h3>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                          Supabase RLS Policy allows SELECT actions to anonymous users on <code className="px-1.5 py-0.5 bg-slate-100 rounded text-indigo-600 font-bold font-mono">rev_projects</code> only when querying with a unique, valid <code className="text-indigo-600 font-bold">share_id</code>.
                        </p>
                        <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Simulate Client Link Visit:</h4>
                          <div className="space-y-2">
                            {projects.map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setClientShareId(p.share_id);
                                  handleClientSearch(p.share_id);
                                }}
                                className="flex items-center justify-between w-full text-left bg-white hover:bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 transition-all hover:border-indigo-500 cursor-pointer shadow-sm"
                              >
                                <span>Project: <strong className="text-slate-800">{p.project_name}</strong> ({p.client_name})</span>
                                <span className="font-mono text-indigo-600 font-bold flex items-center gap-1 text-[11px]">
                                  Use token: {p.share_id.substring(0, 6)}...
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : !activeProjectForClient ? (
                      /* RLS Policy Access Blocked Error Card */
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-rose-200 rounded-3xl p-6 shadow-sm"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0 border border-rose-100">
                            <ShieldAlert className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-md font-bold text-rose-600">Row-Level Security Policy Denied Request</h3>
                            <p className="text-xs text-slate-400 font-mono mt-1">
                              PostgreSQL Code: 42501 (insufficient_privilege)
                            </p>
                            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                              You provided an invalid or empty <code className="text-slate-700 font-semibold font-mono">share_id</code>. The database evaluated the SELECT policy for <code className="px-1.5 py-0.5 bg-rose-50 rounded text-rose-600 font-mono">rev_projects</code> to <code className="text-rose-600 font-bold">false</code>, withholding all rows. No project matches this secure address token.
                            </p>
                            <div className="mt-4 flex gap-2">
                              <button
                                onClick={() => setClientSearchAttempted(false)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                              >
                                Try Another Token
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      /* Active Client Portal Screen */
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
                      >
                        {/* Client Portal Header */}
                        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full uppercase">
                              PUBLIC SHARE PORTAL
                            </span>
                            <h3 className="text-xl font-bold text-slate-800 mt-1.5">{activeProjectForClient.project_name}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Created by {profiles.find(p => p.id === activeProjectForClient.freelancer_id)?.business_name}</p>
                          </div>
                          
                          {/* Revisions Remaining Block */}
                          <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shrink-0 shadow-sm">
                            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Revisions Logged</div>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-xl font-extrabold text-slate-850">
                                {activeProjectForClient.current_revisions_used}
                              </span>
                              <span className="text-slate-400 text-sm">/</span>
                              <span className="text-slate-500 text-sm font-semibold">
                                {activeProjectForClient.total_revisions_allowed}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Client Portal Main Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                          
                          {/* Submit Revision Form */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <Send className="w-4 h-4 text-indigo-600" />
                              Submit a Revision Request
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Use this secure client terminal to document elements needing alteration. Once submitted, your freelancer receives instant alerts. Only active projects can accept submissions.
                            </p>

                            {activeProjectForClient.status === "completed" ? (
                              <div className="p-4 bg-slate-50 text-center rounded-2xl border border-slate-200">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <h5 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Project Marked Completed</h5>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                  Your designer has locked this workflow. No further revisions are expected. Thank you!
                                </p>
                              </div>
                            ) : (
                              <form onSubmit={(e) => handleRequestRevision(e, activeProjectForClient.id)} className="space-y-3">
                                <div>
                                  <label className="block text-xs text-slate-500 font-semibold mb-1">
                                    Describe changes required in detail
                                  </label>
                                  <textarea
                                    required
                                    rows={4}
                                    placeholder="Please clarify: Slide 3 image must be cropped, header typo fixed, or button borders rounded..."
                                    value={newRevisionBody}
                                    onChange={(e) => setNewRevisionBody(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 w-full text-slate-800 focus:outline-none focus:border-indigo-500 font-sans shadow-inner"
                                  />
                                </div>
                                <button
                                  id="client-submit-revision"
                                  type="submit"
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-indigo-100"
                                >
                                  Submit Request (Increments Used Count)
                                </button>
                              </form>
                            )}
                          </div>

                          {/* Revisions History Timeline */}
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                              <Terminal className="w-4 h-4 text-indigo-600" />
                              Revision Thread History
                            </h4>

                            {clientRevisions.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 text-xs border border-slate-200 border-dashed rounded-2xl">
                                No revision requests logged for this project yet. Submit your first request using the form.
                              </div>
                            ) : (
                              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {clientRevisions.map(rev => (
                                  <div key={rev.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs shadow-sm">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase border ${
                                        rev.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                        rev.status === "reviewed" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                        rev.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        "bg-rose-50 text-rose-600 border-rose-100"
                                      }`}>
                                        {rev.status}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {new Date(rev.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-slate-700 font-mono text-[11px] mb-2 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                                      {rev.revision_body}
                                    </p>
                                    {rev.freelancer_comment && (
                                      <div className="mt-2 bg-emerald-50/50 border-l-2 border-emerald-500 pl-2.5 py-1 text-slate-600">
                                        <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-700">Freelancer remark:</div>
                                        <p className="mt-0.5 text-slate-700">{rev.freelancer_comment}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

              </div>

              {/* Sidebar Database Console Logs (Col 9-12) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Simulator Controls & Quick Guides */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-3">Database Statistics</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                      <div className="text-lg font-bold text-slate-800 font-mono">{profiles.length}</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Profiles</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                      <div className="text-lg font-bold text-slate-800 font-mono">{projects.length}</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Projects</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                      <div className="text-lg font-bold text-slate-800 font-mono">{revisions.length}</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Revisions</div>
                    </div>
                  </div>
                  
                  {/* Security Policy Status Check */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Supabase Auth-to-Profile Sync:</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[10px] uppercase font-mono">
                      Active Trigger
                    </span>
                  </div>
                </div>

                {/* Database Logger Terminal */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[400px]">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono font-bold">
                      <Terminal className="w-4 h-4 text-indigo-600" />
                      Live PostgreSQL/RLS Console
                    </div>
                    <button
                      id="clear-logs-btn"
                      onClick={() => setDatabaseLogs([])}
                      className="text-slate-400 hover:text-slate-600 text-[10px] font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Logs Flow */}
                  <div className="flex-1 p-4 overflow-y-auto bg-slate-950 text-left font-mono text-[10px] space-y-3 scrollbar-thin">
                    {databaseLogs.length === 0 ? (
                      <div className="text-zinc-600 text-center py-12">
                        No operations registered yet. Click buttons to trigger logs.
                      </div>
                    ) : (
                      databaseLogs.map(log => (
                        <div key={log.id} className="border-b border-zinc-900/80 pb-2">
                          <div className="flex items-center justify-between text-zinc-500 text-[9px] mb-1">
                            <span>{log.timestamp}</span>
                            <span className={`uppercase font-bold tracking-wider px-1 rounded text-[8px] ${
                              log.type === "auth_trigger" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              log.type === "rls_pass" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              log.type === "rls_fail" ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" :
                              log.type === "insert" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                              "bg-zinc-850 text-zinc-400 border border-zinc-800"
                            }`}>
                              {log.type}
                            </span>
                          </div>
                          <p className={`leading-relaxed whitespace-pre-wrap ${
                            log.type === "rls_fail" ? "text-red-400 font-bold" :
                            log.type === "rls_pass" ? "text-emerald-300" :
                            log.type === "auth_trigger" ? "text-amber-200" :
                            "text-zinc-300"
                          }`}>
                            {log.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
                </>
              )}
          </motion.div>
        )}

      </main>

      {/* Decorative clean footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400 relative z-10 bg-slate-50">
        REV-LIMIT Micro SaaS Schema Blueprint &bull; Designed in AI Studio Console
      </footer>
    </div>
  );
}
