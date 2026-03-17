"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const DEMO_PREFIX = "demo-";
const DEMO_ORG_NAME = "Escola Demonstração";
const DEMO_EMAIL_DOMAIN = "axiom-demo.com";

// ─── Auth Guard ──────────────────────────────────────────────────────────

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("is_super_admin").eq("id", user.id).single();
  if (!profile?.is_super_admin) throw new Error("Forbidden");
  return user;
}

// ─── Demo Names ──────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "João", "Maria", "Pedro", "Ana", "Lucas", "Julia", "Gabriel", "Beatriz",
  "Rafael", "Larissa", "Matheus", "Camila", "Bruno", "Fernanda", "Gustavo",
  "Amanda", "Leonardo", "Mariana", "Felipe", "Carolina", "Thiago", "Isabela",
  "Daniel", "Letícia", "Vinicius", "Bruna", "Arthur", "Gabriela", "Diego",
  "Natalia", "Cauã", "Sophia", "Henrique", "Valentina", "Enzo", "Laura",
  "Nicolas", "Heloísa", "Davi", "Alice", "Luan", "Manuela", "Igor",
  "Helena", "Ryan", "Lívia", "Kaique", "Rafaela", "Caio", "Vitória",
  "Samuel", "Bianca", "Yuri", "Giovanna", "Murilo", "Melissa", "Lorenzo",
  "Júlia", "Bernardo", "Cecília", "Miguel", "Yasmin", "Guilherme", "Nicole",
  "Eduardo", "Luiza", "André", "Clara", "Rodrigo", "Marina", "Alessandro",
  "Raquel", "Otávio", "Luna", "Francisco",
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
  "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
  "Araujo", "Melo", "Barbosa", "Nascimento", "Moreira", "Cardoso",
  "Monteiro", "Correia", "Vieira", "Pinto", "Teixeira",
];

const SUBJECTS = ["Matemática", "Física", "Química", "Biologia", "História"];
const TOPICS: Record<string, string[]> = {
  "Matemática": ["Equações 1° grau", "Equações 2° grau", "Frações", "Geometria Plana", "Probabilidade", "Trigonometria", "Funções", "Porcentagem"],
  "Física": ["Cinemática", "Dinâmica", "Termodinâmica", "Óptica", "Eletricidade", "Ondas"],
  "Química": ["Estequiometria", "Tabela Periódica", "Ligações Químicas", "Soluções", "pH e Ácidos"],
  "Biologia": ["Genética", "Ecologia", "Citologia", "Evolução", "Fisiologia"],
  "História": ["Brasil Colônia", "Revolução Industrial", "Guerras Mundiais", "Era Vargas", "República"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gaussianRand(mean: number, std: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.max(0, Math.min(1, mean + z * std));
}

function generateStudentArchetype() {
  const r = Math.random();
  if (r < 0.15) return { type: "excellent", accuracy: 0.85, activity: 0.9, streak: 35 };
  if (r < 0.35) return { type: "good", accuracy: 0.75, activity: 0.7, streak: 20 };
  if (r < 0.65) return { type: "average", accuracy: 0.65, activity: 0.5, streak: 10 };
  if (r < 0.85) return { type: "struggling", accuracy: 0.50, activity: 0.35, streak: 5 };
  return { type: "disengaged", accuracy: 0.40, activity: 0.15, streak: 2 };
}

// Run promises in chunks to avoid overwhelming Supabase Auth API
async function runInChunks<T>(items: (() => Promise<T>)[], chunkSize: number): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(fn => fn()));
    results.push(...chunkResults);
  }
  return results;
}

/**
 * Create a demo user or return existing if email already exists.
 * Handles re-seed after partial cleanup.
 */
async function getOrCreateDemoUser(
  email: string,
  fullName: string
): Promise<string | null> {
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: "DemoPassword123!",
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (created?.user?.id) return created.user.id;

  // If user already exists (duplicate email), look them up
  if (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabaseAdmin.from("profiles") as any)
      .select("id").eq("email", email).single();
    if (profile) return profile.id;
  }

  return null;
}

// ─── Seed Action (Optimized: batched inserts, parallel auth) ─────────────

export async function seedDemoData(): Promise<{ success: boolean; message: string }> {
  const adminUser = await requireSuperAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabaseAdmin.from("organizations") as any)
    .select("id").eq("name", DEMO_ORG_NAME).single();
  if (existing) return { success: false, message: "Demo data already exists. Remove first." };

  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 1. Create org (1 insert)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org, error: orgErr } = await (supabaseAdmin.from("organizations") as any)
      .insert({
        name: DEMO_ORG_NAME,
        type: "school",
        status: "active",
        created_by: adminUser.id,
        requested_at: ninetyDaysAgo.toISOString(),
        approved_at: ninetyDaysAgo.toISOString(),
        requested_by_name: "Admin Demo",
        requested_by_email: `admin@${DEMO_EMAIL_DOMAIN}`,
      })
      .select("id")
      .single();
    if (orgErr) throw new Error(`Org: ${orgErr.message}`);
    const orgId = org.id;

    // 2. Create director (1 auth call)
    const directorEmail = `${DEMO_PREFIX}director@${DEMO_EMAIL_DOMAIN}`;
    const directorId = await getOrCreateDemoUser(directorEmail, "Dr. Roberto Mendes");
    if (directorId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("profiles") as any)
        .update({ full_name: "Dr. Roberto Mendes", email: directorEmail })
        .eq("id", directorId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("org_memberships") as any)
        .upsert({ user_id: directorId, org_id: orgId, role: "director" }, { onConflict: "user_id,org_id" });
    }

    // 3. Create 3 teachers (3 auth calls — sequential is fine, only 3)
    const classNames = ["9º Ano A", "9º Ano B", "8º Ano A"];
    const teacherNames = ["Prof. Ana Costa", "Prof. Carlos Lima", "Prof. Patrícia Santos"];
    const classIds: string[] = [];
    const teacherIds: (string | null)[] = [];

    for (let c = 0; c < 3; c++) {
      const teacherEmail = `${DEMO_PREFIX}teacher${c + 1}@${DEMO_EMAIL_DOMAIN}`;
      const teacherId = await getOrCreateDemoUser(teacherEmail, teacherNames[c]);
      teacherIds.push(teacherId);
      if (teacherId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from("profiles") as any)
          .update({ full_name: teacherNames[c], email: teacherEmail })
          .eq("id", teacherId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from("org_memberships") as any)
          .upsert({ user_id: teacherId, org_id: orgId, role: "teacher" }, { onConflict: "user_id,org_id" });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cls } = await (supabaseAdmin.from("classes") as any)
        .insert({ name: classNames[c], org_id: orgId, teacher_id: teacherId })
        .select("id")
        .single();
      if (!cls) throw new Error(`Failed to create class ${classNames[c]}`);
      classIds.push(cls.id);
    }

    // 4. Create 75 students in parallel chunks of 5
    // Each auth.admin.createUser takes ~200-400ms, so 5 in parallel ≈ 3 seconds per chunk
    // 15 chunks × 3s = ~45s total for auth (within Vercel Pro 60s limit)
    const studentData: { userId: string; classIdx: number; archetype: ReturnType<typeof generateStudentArchetype>; fullName: string; email: string }[] = [];

    const authTasks = Array.from({ length: 75 }, (_, idx) => {
      const classIdx = Math.floor(idx / 25);
      const firstName = FIRST_NAMES[idx % FIRST_NAMES.length];
      const lastName = LAST_NAMES[idx % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;
      const email = `${DEMO_PREFIX}${firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${lastName.toLowerCase()}.${idx}@${DEMO_EMAIL_DOMAIN}`;
      const archetype = generateStudentArchetype();

      return async () => {
        const userId = await getOrCreateDemoUser(email, fullName);
        if (userId) {
          studentData.push({ userId, classIdx, archetype, fullName, email });
        }
      };
    });

    // Run auth creation in chunks of 5 (15 rounds)
    await runInChunks(authTasks, 5);

    // 5. Now batch-insert ALL student data in bulk
    // Accumulate all rows, then do a few large batch inserts instead of hundreds of individual ones

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileUpdates: Promise<any>[] = [];
    const orgMembershipRows: { user_id: string; org_id: string; role: string }[] = [];
    const classMembershipRows: { user_id: string; class_id: string }[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allChallengeRows: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allStudentProfiles: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allSubjectRows: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allUsageRows: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allBadgeRows: any[] = [];

    for (const student of studentData) {
      const { userId, classIdx, archetype, fullName, email } = student;
      const streakDays = Math.max(0, Math.round(archetype.streak * gaussianRand(1, 0.3)));
      const lastActive = new Date(now.getTime() - rand(0, archetype.type === "disengaged" ? 30 : 5) * 24 * 60 * 60 * 1000);

      // Profile update must be individual (update by id)
      profileUpdates.push(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabaseAdmin.from("profiles") as any)
          .update({
            full_name: fullName,
            email,
            plan: "pro",
            current_streak: streakDays,
            last_active_date: lastActive.toISOString().split("T")[0],
          })
          .eq("id", userId)
      );

      orgMembershipRows.push({ user_id: userId, org_id: orgId, role: "student" });
      classMembershipRows.push({ user_id: userId, class_id: classIds[classIdx] });

      // Challenge log
      const numChallenges = rand(20, 80);
      let totalSolved = 0;
      let totalCorrect = 0;

      for (let i = 0; i < numChallenges; i++) {
        const daysAgo = rand(0, 89);
        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const subject = pick(SUBJECTS);
        const topic = pick(TOPICS[subject]);
        const _level = Math.min(5, Math.max(1, Math.round(gaussianRand(archetype.accuracy * 4, 0.8))));
        const isCorrect = Math.random() < gaussianRand(archetype.accuracy, 0.1);
        allChallengeRows.push({
          user_id: userId, subject, topic,
          created_at: date.toISOString(),
        });
        totalSolved++;
        if (isCorrect) totalCorrect++;
      }

      // Student profile
      allStudentProfiles.push({
        id: userId,
        total_problems_solved: totalSolved,
        total_correct: totalCorrect,
        school_year: classNames[classIdx].startsWith("9") ? "9º ano" : "8º ano",
        subjects_of_interest: SUBJECTS.slice(0, rand(2, 4)),
        onboarding_completed: true,
      });

      // Subjects / knowledge map
      const numTopics = rand(5, 15);
      const pickedTopics = new Set<string>();
      while (pickedTopics.size < numTopics) {
        const subj = pick(SUBJECTS);
        pickedTopics.add(`${subj}::${pick(TOPICS[subj])}`);
      }
      for (const t of pickedTopics) {
        const [subj, topic] = t.split("::");
        const masteryLevel = Math.min(5, Math.max(1, Math.round(gaussianRand(archetype.accuracy * 5, 1.2))));
        const cc = rand(3, 20);
        const ic = rand(1, Math.max(1, Math.round(cc * (1 - archetype.accuracy))));
        allSubjectRows.push({
          user_id: userId,
          name: `${subj} - ${topic}`,
          mastery_pct: Math.min(100, masteryLevel * 20),
          queries_count: cc + ic,
        });
      }

      // Usage
      for (let d = 0; d < 90; d++) {
        if (Math.random() > archetype.activity * (d < 60 ? 0.8 : 1)) continue;
        const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const activityMul = isWeekend ? 0.4 : 1;
        allUsageRows.push({
          user_id: userId,
          date: date.toISOString().split("T")[0],
          solves: Math.round(rand(1, 8) * activityMul * archetype.activity),
          writes: Math.round(rand(0, 3) * activityMul * archetype.activity),
          humanizes: Math.round(rand(0, 2) * activityMul * archetype.activity),
          learns: Math.round(rand(0, 5) * activityMul * archetype.activity),
        });
      }

      // Badges
      const badgeIds = ["first_solve"];
      if (totalSolved >= 10) badgeIds.push("10_problems");
      if (totalSolved >= 50) badgeIds.push("50_problems");
      if (streakDays >= 3) badgeIds.push("3_day_streak");
      if (streakDays >= 7) badgeIds.push("7_day_streak");
      if (archetype.type === "excellent") badgeIds.push("first_master", "accuracy_star");
      for (const bid of badgeIds) {
        allBadgeRows.push({ user_id: userId, badge_id: bid, unlocked_at: now.toISOString() });
      }
    }

    // 6. Execute all batch inserts in parallel where possible
    // Profile updates run in chunks of 10 (they're individual updates)
    const profileChunks = [];
    for (let i = 0; i < profileUpdates.length; i += 10) {
      profileChunks.push(profileUpdates.slice(i, i + 10));
    }
    for (const chunk of profileChunks) {
      await Promise.all(chunk);
    }

    // Batch inserts: memberships (1 insert each)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("org_memberships") as any).insert(orgMembershipRows);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("class_memberships") as any).insert(classMembershipRows);

    // Batch insert: student_profiles (1 upsert)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("student_profiles") as any).upsert(allStudentProfiles);

    // Batch insert: challenge_log in chunks of 500
    for (let i = 0; i < allChallengeRows.length; i += 500) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("challenge_log") as any).insert(allChallengeRows.slice(i, i + 500));
    }

    // Batch insert: subjects in chunks of 200
    for (let i = 0; i < allSubjectRows.length; i += 200) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("subjects") as any).upsert(allSubjectRows.slice(i, i + 200), { onConflict: "user_id,name" });
    }

    // Batch insert: usage in chunks of 500
    for (let i = 0; i < allUsageRows.length; i += 500) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("usage") as any).insert(allUsageRows.slice(i, i + 500));
    }

    // Batch insert: badges in chunks of 200
    for (let i = 0; i < allBadgeRows.length; i += 200) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("user_badges") as any).upsert(allBadgeRows.slice(i, i + 200), { onConflict: "user_id,badge_id" });
    }

    return { success: true, message: `Demo created: ${DEMO_ORG_NAME} with 3 classes × ${studentData.length} students` };
  } catch (err) {
    return { success: false, message: `Error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─── Remove Demo ─────────────────────────────────────────────────────────

export async function removeDemoData(): Promise<{ success: boolean; message: string }> {
  await requireSuperAdmin();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabaseAdmin.from("organizations") as any)
      .select("id").eq("name", DEMO_ORG_NAME).single();
    if (!org) return { success: false, message: "No demo data found." };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabaseAdmin.from("org_memberships") as any)
      .select("user_id").eq("org_id", org.id);
    const userIds = (members || []).map((m: { user_id: string }) => m.user_id);

    if (userIds.length > 0) {
      // Batch deletes (all at once via .in())
      await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabaseAdmin.from("challenge_log") as any).delete().in("user_id", userIds),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabaseAdmin.from("usage") as any).delete().in("user_id", userIds),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabaseAdmin.from("student_profiles") as any).delete().in("id", userIds),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabaseAdmin.from("user_badges") as any).delete().in("user_id", userIds),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabaseAdmin.from("subjects") as any).delete().in("user_id", userIds),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("class_memberships") as any).delete().in("user_id", userIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("org_memberships") as any).delete().in("user_id", userIds);

      // Delete auth users in parallel chunks of 5
      await runInChunks(
        userIds.map((uid: string) => () => supabaseAdmin.auth.admin.deleteUser(uid)),
        5
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("classes") as any).delete().eq("org_id", org.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("organizations") as any).delete().eq("id", org.id);

    return { success: true, message: `Removed: ${userIds.length} users, classes, org` };
  } catch (err) {
    return { success: false, message: `Error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─── Check Demo Status ───────────────────────────────────────────────────

export async function checkDemoStatus(): Promise<{ exists: boolean }> {
  await requireSuperAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from("organizations") as any)
    .select("id").eq("name", DEMO_ORG_NAME).single();
  return { exists: !!data };
}
