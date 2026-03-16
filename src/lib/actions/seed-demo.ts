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

// Student archetype: determines how "good" and "active" a student is
function generateStudentArchetype() {
  const r = Math.random();
  if (r < 0.15) return { type: "excellent", accuracy: 0.85, activity: 0.9, streak: 35 };
  if (r < 0.35) return { type: "good", accuracy: 0.75, activity: 0.7, streak: 20 };
  if (r < 0.65) return { type: "average", accuracy: 0.65, activity: 0.5, streak: 10 };
  if (r < 0.85) return { type: "struggling", accuracy: 0.50, activity: 0.35, streak: 5 };
  return { type: "disengaged", accuracy: 0.40, activity: 0.15, streak: 2 };
}

// ─── Seed Action ─────────────────────────────────────────────────────────

export async function seedDemoData(): Promise<{ success: boolean; message: string }> {
  await requireSuperAdmin();

  // Check if demo org already exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabaseAdmin.from("organizations") as any)
    .select("id").eq("name", DEMO_ORG_NAME).single();
  if (existing) return { success: false, message: "Demo data already exists. Remove first." };

  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 1. Create demo org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org, error: orgErr } = await (supabaseAdmin.from("organizations") as any)
      .insert({
        name: DEMO_ORG_NAME,
        type: "school",
        status: "active",
        requested_at: ninetyDaysAgo.toISOString(),
        approved_at: ninetyDaysAgo.toISOString(),
        requested_by_name: "Admin Demo",
        requested_by_email: `admin@${DEMO_EMAIL_DOMAIN}`,
      })
      .select("id")
      .single();
    if (orgErr) throw new Error(`Org: ${orgErr.message}`);
    const orgId = org.id;

    // 2. Create director user via auth
    const directorEmail = `${DEMO_PREFIX}director@${DEMO_EMAIL_DOMAIN}`;
    const { data: dirAuth } = await supabaseAdmin.auth.admin.createUser({
      email: directorEmail,
      password: "DemoPassword123!",
      email_confirm: true,
      user_metadata: { full_name: "Dr. Roberto Mendes" },
    });
    if (dirAuth?.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("profiles") as any)
        .update({ full_name: "Dr. Roberto Mendes", email: directorEmail })
        .eq("id", dirAuth.user.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("org_memberships") as any)
        .insert({ user_id: dirAuth.user.id, org_id: orgId, role: "director" });
    }

    // 3. Create 3 classes with teachers
    const classNames = ["9º Ano A", "9º Ano B", "8º Ano A"];
    const teacherNames = ["Prof. Ana Costa", "Prof. Carlos Lima", "Prof. Patrícia Santos"];
    const classIds: string[] = [];

    for (let c = 0; c < 3; c++) {
      // Create teacher
      const teacherEmail = `${DEMO_PREFIX}teacher${c + 1}@${DEMO_EMAIL_DOMAIN}`;
      const { data: tAuth } = await supabaseAdmin.auth.admin.createUser({
        email: teacherEmail,
        password: "DemoPassword123!",
        email_confirm: true,
        user_metadata: { full_name: teacherNames[c] },
      });
      const teacherId = tAuth?.user?.id;
      if (teacherId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from("profiles") as any)
          .update({ full_name: teacherNames[c], email: teacherEmail })
          .eq("id", teacherId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from("org_memberships") as any)
          .insert({ user_id: teacherId, org_id: orgId, role: "teacher" });
      }

      // Create class
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cls } = await (supabaseAdmin.from("classes") as any)
        .insert({
          name: classNames[c],
          org_id: orgId,
          teacher_id: teacherId || null,
        })
        .select("id")
        .single();
      classIds.push(cls.id);

      // 4. Create 25 students per class
      for (let s = 0; s < 25; s++) {
        const idx = c * 25 + s;
        const firstName = FIRST_NAMES[idx % FIRST_NAMES.length];
        const lastName = LAST_NAMES[idx % LAST_NAMES.length];
        const fullName = `${firstName} ${lastName}`;
        const email = `${DEMO_PREFIX}${firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${lastName.toLowerCase()}.${idx}@${DEMO_EMAIL_DOMAIN}`;

        const archetype = generateStudentArchetype();

        // Create auth user
        const { data: sAuth } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: "DemoPassword123!",
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });
        const userId = sAuth?.user?.id;
        if (!userId) continue;

        // Profile
        const streakDays = Math.max(0, Math.round(archetype.streak * gaussianRand(1, 0.3)));
        const lastActive = new Date(now.getTime() - rand(0, archetype.type === "disengaged" ? 30 : 5) * 24 * 60 * 60 * 1000);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from("profiles") as any)
          .update({
            full_name: fullName,
            email,
            plan: "pro",
            current_streak: streakDays,
            last_active_date: lastActive.toISOString().split("T")[0],
          })
          .eq("id", userId);

        // Org + class membership
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from("org_memberships") as any)
          .insert({ user_id: userId, org_id: orgId, role: "student" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from("class_memberships") as any)
          .insert({ user_id: userId, class_id: cls.id });

        // Generate challenge_log (20-80 entries over 90 days)
        const numChallenges = rand(20, 80);
        const challengeRows = [];
        let totalSolved = 0;
        let totalCorrect = 0;

        for (let i = 0; i < numChallenges; i++) {
          const daysAgo = rand(0, 89);
          const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          const subject = pick(SUBJECTS);
          const topic = pick(TOPICS[subject]);
          const level = Math.min(5, Math.max(1, Math.round(gaussianRand(archetype.accuracy * 4, 0.8))));
          const isCorrect = Math.random() < gaussianRand(archetype.accuracy, 0.1);

          challengeRows.push({
            user_id: userId,
            subject,
            topic,
            level,
            is_correct: isCorrect,
            challenge_text: `Demo challenge #${i + 1}`,
            student_answer: isCorrect ? "correct answer" : "wrong answer",
            feedback: isCorrect ? "Correto!" : "Incorreto. Revise o conceito.",
            created_at: date.toISOString(),
          });

          totalSolved++;
          if (isCorrect) totalCorrect++;
        }

        // Batch insert challenges (chunks of 50)
        for (let i = 0; i < challengeRows.length; i += 50) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabaseAdmin.from("challenge_log") as any)
            .insert(challengeRows.slice(i, i + 50));
        }

        // Student profile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from("student_profiles") as any)
          .upsert({
            id: userId,
            total_problems_solved: totalSolved,
            total_correct: totalCorrect,
            school_year: classNames[c].startsWith("9") ? "9º ano" : "8º ano",
            subjects_of_interest: SUBJECTS.slice(0, rand(2, 4)),
            onboarding_completed: true,
          });

        // Knowledge map (5-15 topics)
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabaseAdmin.from("subjects") as any)
            .upsert({
              user_id: userId,
              name: `${subj} - ${topic}`,
              mastery_pct: Math.min(100, masteryLevel * 20),
              queries_count: cc + ic,
            }, { onConflict: "user_id,name" });
        }

        // Usage (daily records for last 90 days, with weekend dip)
        const usageRows = [];
        for (let d = 0; d < 90; d++) {
          if (Math.random() > archetype.activity * (d < 60 ? 0.8 : 1)) continue;
          const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const activityMul = isWeekend ? 0.4 : 1;

          usageRows.push({
            user_id: userId,
            date: date.toISOString().split("T")[0],
            solves: Math.round(rand(1, 8) * activityMul * archetype.activity),
            writes: Math.round(rand(0, 3) * activityMul * archetype.activity),
            humanizes: Math.round(rand(0, 2) * activityMul * archetype.activity),
            learns: Math.round(rand(0, 5) * activityMul * archetype.activity),
          });
        }

        if (usageRows.length > 0) {
          for (let i = 0; i < usageRows.length; i += 50) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabaseAdmin.from("usage") as any)
              .insert(usageRows.slice(i, i + 50));
          }
        }

        // Badges (based on archetype)
        const badgeIds = ["first_solve"];
        if (totalSolved >= 10) badgeIds.push("10_problems");
        if (totalSolved >= 50) badgeIds.push("50_problems");
        if (streakDays >= 3) badgeIds.push("3_day_streak");
        if (streakDays >= 7) badgeIds.push("7_day_streak");
        if (archetype.type === "excellent") badgeIds.push("first_master", "accuracy_star");

        for (const bid of badgeIds) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabaseAdmin.from("user_badges") as any)
            .upsert({ user_id: userId, badge_id: bid, unlocked_at: now.toISOString() }, { onConflict: "user_id,badge_id" });
        }
      }
    }

    return { success: true, message: `Demo created: ${DEMO_ORG_NAME} with 3 classes × 25 students` };
  } catch (err) {
    return { success: false, message: `Error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─── Remove Demo ─────────────────────────────────────────────────────────

export async function removeDemoData(): Promise<{ success: boolean; message: string }> {
  await requireSuperAdmin();

  try {
    // Find the demo org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabaseAdmin.from("organizations") as any)
      .select("id").eq("name", DEMO_ORG_NAME).single();
    if (!org) return { success: false, message: "No demo data found." };

    // Get all demo user IDs (org members + auth users with demo email)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabaseAdmin.from("org_memberships") as any)
      .select("user_id").eq("org_id", org.id);
    const userIds = (members || []).map((m: { user_id: string }) => m.user_id);

    // Delete challenge_log, usage, student_profiles, badges for these users
    if (userIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("challenge_log") as any).delete().in("user_id", userIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("usage") as any).delete().in("user_id", userIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("student_profiles") as any).delete().in("id", userIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("user_badges") as any).delete().in("user_id", userIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("subjects") as any).delete().in("user_id", userIds);

      // Delete memberships
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("class_memberships") as any).delete().in("user_id", userIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("org_memberships") as any).delete().in("user_id", userIds);

      // Delete auth users
      for (const uid of userIds) {
        await supabaseAdmin.auth.admin.deleteUser(uid);
      }
    }

    // Delete classes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("classes") as any).delete().eq("org_id", org.id);

    // Delete org
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
