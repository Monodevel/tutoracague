import { useEffect, useState } from "react";
import { apiGet } from "./api/client";
import type {
  DeviceStatus,
  Lesson,
  StudyTopicDetail,
  UserProfile,
} from "./api/types";

import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { RightPanel } from "./components/layout/RightPanel";

import { HomePage } from "./pages/HomePage";
import { SetupPage } from "./pages/SetupPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StudyPage } from "./pages/StudyPage";
import { StudyTutorPage } from "./pages/StudyTutorPage";
import { PracticePage } from "./pages/PracticePage";
import { ProgressPage } from "./pages/ProgressPage";
import { TeachingSessionPage } from "./pages/TeachingSessionPage";
import { MapStudyPage } from "./pages/MapStudyPage";

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");

  const [selectedStudyTopicId, setSelectedStudyTopicId] = useState<
    number | null
  >(null);

  const [teachingContext, setTeachingContext] = useState<{
    topic: StudyTopicDetail;
    lesson: Lesson;
  } | null>(null);

  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [profileResult, statusResult] = await Promise.all([
          apiGet<UserProfile | null>("/profile"),
          apiGet<DeviceStatus>("/device/status"),
        ]);

        setProfile(profileResult);
        setDeviceStatus(statusResult);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function refreshDeviceStatus() {
      try {
        const status = await apiGet<DeviceStatus>("/device/status");

        if (isMounted) {
          setDeviceStatus(status);
        }
      } catch {
        // En el dispositivo embebido no se debe romper la interfaz
        // si una lectura temporal del estado falla.
      }
    }

    const intervalId = window.setInterval(refreshDeviceStatus, 1000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  function navigate(page: string) {
    setCurrentPage(page);

    if (page !== "study") {
      setSelectedStudyTopicId(null);
      setTeachingContext(null);
    }
  }

  if (loading) {
    return (
      <div className="grid h-screen place-items-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="text-xl font-black text-white">TutorAcague</div>
          <div className="mt-2 text-sm text-slate-400">
            Iniciando sistema...
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !profile.initial_setup_completed) {
    return (
      <SetupPage
        onCompleted={(savedProfile) => {
          setProfile(savedProfile);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
      />

      <main className="grid min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
        <Topbar
          profile={profile}
          deviceStatus={deviceStatus}
          onOpenRightPanel={() => setRightPanelOpen(true)}
        />

        <div className="min-h-0 overflow-hidden p-4">
          {currentPage === "home" && <HomePage />}

          {currentPage === "study" &&
            selectedStudyTopicId === null &&
            teachingContext === null && (
              <StudyPage
                onStartStudy={(topicId) => setSelectedStudyTopicId(topicId)}
              />
            )}

          {currentPage === "study" && selectedStudyTopicId !== null && (
            <StudyTutorPage
              topicId={selectedStudyTopicId}
              onBack={() => setSelectedStudyTopicId(null)}
              onPractice={() => {
                setCurrentPage("practice");
              }}
            />
          )}

          {currentPage === "study" && teachingContext !== null && (
            <TeachingSessionPage
              topic={teachingContext.topic}
              lesson={teachingContext.lesson}
              onBack={() => setTeachingContext(null)}
              onPractice={() => {
                setTeachingContext(null);
                setCurrentPage("practice");
              }}
            />
          )}

          {currentPage === "practice" && <PracticePage />}
          {currentPage === "maps" && <MapStudyPage />}

          {currentPage === "progress" && <ProgressPage />}

          {currentPage === "settings" && (
            <SettingsPage
              onProfileUpdated={(updatedProfile) => {
                setProfile(updatedProfile);
              }}
            />
          )}
        </div>
      </main>

      <RightPanel
        open={rightPanelOpen}
        onClose={() => setRightPanelOpen(false)}
        deviceStatus={deviceStatus}
      />
    </div>
  );
}