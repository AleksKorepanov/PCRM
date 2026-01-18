import { Role } from "@/lib/store";

export type Locale = "ru" | "en";

type PageCopy = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  actionLabel: string;
};

type TextCopy = {
  appName: string;
  workspaceSwitcherLabel: string;
  workspaceSwitcherHelper: string;
  userMenuLabel: string;
  userMenuDescription: string;
  shell: {
    roleAwareNavNote: string;
  };
  errors: {
    shellKicker: string;
    shellTitle: string;
    shellDescription: string;
    shellAction: string;
  };
  roleLabels: Record<Role, string>;
  nav: Record<
    | "dashboard"
    | "contacts"
    | "orgs"
    | "communities"
    | "needsOffers"
    | "introductions"
    | "commitments"
    | "research"
    | "analytics"
    | "settings",
    string
  >;
  actions: {
    inviteMembers: string;
    manageWorkspace: string;
    createWorkspace: string;
    viewProfile: string;
    signOut: string;
    accessRestricted: string;
  };
  pages: Record<
    | "dashboard"
    | "contacts"
    | "orgs"
    | "communities"
    | "needsOffers"
    | "introductions"
    | "commitments"
    | "research"
    | "analytics"
    | "settings",
    PageCopy
  >;
};

const text: Record<Locale, TextCopy> = {
  ru: {
    appName: "PCRM",
    workspaceSwitcherLabel: "Рабочее пространство",
    workspaceSwitcherHelper: "Выберите активное пространство",
    userMenuLabel: "Пользователь",
    userMenuDescription: "Настройки профиля и доступа",
    shell: {
      roleAwareNavNote: "Навигация учитывает роль пользователя.",
    },
    errors: {
      shellKicker: "Что-то пошло не так",
      shellTitle: "Ошибка загрузки раздела",
      shellDescription:
        "Попробуйте обновить данные или вернуться позже. Если проблема повторяется, сообщите администратору.",
      shellAction: "Повторить",
    },
    roleLabels: {
      owner: "Владелец",
      admin: "Администратор",
      member: "Участник",
      assistant: "Ассистент",
      "read-only": "Только просмотр",
    },
    nav: {
      dashboard: "Дашборд",
      contacts: "Контакты",
      orgs: "Организации",
      communities: "Сообщества",
      needsOffers: "Needs/Offers",
      introductions: "Интро",
      commitments: "Обязательства",
      research: "Исследования",
      analytics: "Аналитика",
      settings: "Настройки",
    },
    actions: {
      inviteMembers: "Пригласить участников",
      manageWorkspace: "Управлять доступами",
      createWorkspace: "Создать пространство",
      viewProfile: "Профиль",
      signOut: "Выйти",
      accessRestricted: "Недостаточно прав",
    },
    pages: {
      dashboard: {
        title: "Дашборд",
        description:
          "Ключевые метрики и задачи по отношениям внутри выбранного пространства.",
        emptyTitle: "Пока нет активности",
        emptyDescription:
          "Создайте контакт или добавьте интеракцию, чтобы наполнить ленту.",
        actionLabel: "Добавить контакт",
      },
      contacts: {
        title: "Контакты",
        description: "Централизованный каталог людей, тегов и контекста доверия.",
        emptyTitle: "Контакты не добавлены",
        emptyDescription: "Импортируйте список или создайте первый контакт.",
        actionLabel: "Создать контакт",
      },
      orgs: {
        title: "Организации",
        description: "Компании и команды, связанные с вашими контактами.",
        emptyTitle: "Организации пока пусты",
        emptyDescription: "Свяжите людей с организациями или добавьте новую.",
        actionLabel: "Добавить организацию",
      },
      communities: {
        title: "Сообщества",
        description: "Группы, клубы и сообщества, в которых участвуют контакты.",
        emptyTitle: "Сообщества не настроены",
        emptyDescription: "Создайте первое сообщество для отслеживания связей.",
        actionLabel: "Создать сообщество",
      },
      needsOffers: {
        title: "Needs/Offers",
        description: "Сопоставление потребностей и предложений по всему пространству.",
        emptyTitle: "Needs/Offers пока пусты",
        emptyDescription: "Добавьте запросы и предложения, чтобы запустить матчинг.",
        actionLabel: "Добавить запрос",
      },
      introductions: {
        title: "Интро",
        description: "Запросы на знакомства и контроль согласий сторон.",
        emptyTitle: "Интро не созданы",
        emptyDescription: "Добавьте запрос и отметьте согласие участников.",
        actionLabel: "Создать интро",
      },
      commitments: {
        title: "Обязательства",
        description: "Реестр обещаний, сроков и индекса надежности.",
        emptyTitle: "Обязательства отсутствуют",
        emptyDescription: "Зафиксируйте обещание, чтобы контролировать выполнение.",
        actionLabel: "Добавить обязательство",
      },
      research: {
        title: "Исследования",
        description: "AI-исследования и семантический поиск по связям.",
        emptyTitle: "Исследования не запущены",
        emptyDescription: "Создайте заметку или запрос на исследование.",
        actionLabel: "Создать исследование",
      },
      analytics: {
        title: "Аналитика",
        description: "Отчеты по отношениям, интро и надежности команды.",
        emptyTitle: "Данные аналитики пусты",
        emptyDescription: "Нужна активность в контактах и обязательствах.",
        actionLabel: "Сформировать отчет",
      },
      settings: {
        title: "Настройки",
        description: "Управление рабочими пространствами, доступами и приватностью.",
        emptyTitle: "Настройки не заполнены",
        emptyDescription: "Настройте роли и политику приватности для команды.",
        actionLabel: "Открыть настройки",
      },
    },
  },
  en: {
    appName: "PCRM",
    workspaceSwitcherLabel: "Workspace",
    workspaceSwitcherHelper: "Select active workspace",
    userMenuLabel: "User",
    userMenuDescription: "Profile and access settings",
    shell: {
      roleAwareNavNote: "Navigation adapts to the user's role.",
    },
    errors: {
      shellKicker: "Something went wrong",
      shellTitle: "Section failed to load",
      shellDescription:
        "Try refreshing or come back later. If the issue persists, contact an administrator.",
      shellAction: "Retry",
    },
    roleLabels: {
      owner: "Owner",
      admin: "Admin",
      member: "Member",
      assistant: "Assistant",
      "read-only": "Read-only",
    },
    nav: {
      dashboard: "Dashboard",
      contacts: "Contacts",
      orgs: "Organizations",
      communities: "Communities",
      needsOffers: "Needs/Offers",
      introductions: "Introductions",
      commitments: "Commitments",
      research: "Research",
      analytics: "Analytics",
      settings: "Settings",
    },
    actions: {
      inviteMembers: "Invite members",
      manageWorkspace: "Manage access",
      createWorkspace: "Create workspace",
      viewProfile: "Profile",
      signOut: "Sign out",
      accessRestricted: "Insufficient access",
    },
    pages: {
      dashboard: {
        title: "Dashboard",
        description: "Core metrics and relationship tasks for the active workspace.",
        emptyTitle: "No activity yet",
        emptyDescription: "Create a contact or log an interaction to get started.",
        actionLabel: "Add contact",
      },
      contacts: {
        title: "Contacts",
        description: "Centralized catalog of people, tags, and trust context.",
        emptyTitle: "No contacts yet",
        emptyDescription: "Import a list or create your first contact.",
        actionLabel: "Create contact",
      },
      orgs: {
        title: "Organizations",
        description: "Companies and teams connected to your contacts.",
        emptyTitle: "Organizations are empty",
        emptyDescription: "Link people to organizations or add a new one.",
        actionLabel: "Add organization",
      },
      communities: {
        title: "Communities",
        description: "Groups, clubs, and communities where contacts participate.",
        emptyTitle: "Communities not set",
        emptyDescription: "Create the first community to track relationships.",
        actionLabel: "Create community",
      },
      needsOffers: {
        title: "Needs/Offers",
        description: "Match needs and offers across the workspace.",
        emptyTitle: "No needs or offers yet",
        emptyDescription: "Add requests and offers to start matching.",
        actionLabel: "Add request",
      },
      introductions: {
        title: "Introductions",
        description: "Introduction requests with consent tracking.",
        emptyTitle: "No introductions yet",
        emptyDescription: "Create a request and capture participant consent.",
        actionLabel: "Create intro",
      },
      commitments: {
        title: "Commitments",
        description: "Register promises, deadlines, and reliability index.",
        emptyTitle: "No commitments yet",
        emptyDescription: "Log a commitment to track follow-through.",
        actionLabel: "Add commitment",
      },
      research: {
        title: "Research",
        description: "AI research and semantic search across relationships.",
        emptyTitle: "No research yet",
        emptyDescription: "Create a note or start a research request.",
        actionLabel: "Start research",
      },
      analytics: {
        title: "Analytics",
        description: "Reports on relationships, intros, and team reliability.",
        emptyTitle: "Analytics is empty",
        emptyDescription: "You need activity across contacts and commitments.",
        actionLabel: "Generate report",
      },
      settings: {
        title: "Settings",
        description: "Workspace, access, and privacy management.",
        emptyTitle: "Settings not configured",
        emptyDescription: "Configure roles and privacy policies for the team.",
        actionLabel: "Open settings",
      },
    },
  },
};

export function resolveLocale(value?: string | null): Locale {
  if (!value) {
    return "ru";
  }
  if (value.toLowerCase().startsWith("en")) {
    return "en";
  }
  return "ru";
}

export function getText(locale: Locale): TextCopy {
  return text[locale] ?? text.ru;
}

export type { TextCopy };
