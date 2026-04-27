import { useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useContent } from "@/lib/ContentProvider";
import { Clock, ArrowLeft, ExternalLink } from "lucide-react";

export default function LessonDetail() {
  const { moduleSlug, lessonSlug } = useParams<{ moduleSlug: string; lessonSlug: string }>();
  const { modules, lessons, resources } = useContent();

  const mod = useMemo(
    () => modules.find((m) => m.slug === moduleSlug),
    [modules, moduleSlug],
  );
  const lesson = useMemo(
    () => lessons.find((l) => l.slug === lessonSlug && l.module_id === mod?.id),
    [lessons, lessonSlug, mod],
  );
  const lessonResources = useMemo(
    () => resources.filter((r) => r.lesson_id === lesson?.id),
    [resources, lesson],
  );

  if (!mod || !lesson) {
    return <Navigate to="/modules" replace />;
  }

  const modLessons = lessons.filter((l) => l.module_id === mod.id);
  const lessonIndex = modLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = lessonIndex > 0 ? modLessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < modLessons.length - 1 ? modLessons[lessonIndex + 1] : null;

  return (
    <div className="max-w-[800px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <nav className="mb-6">
        <Link
          to="/modules"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {mod.title}
        </Link>
      </nav>

      <header className="mb-8">
        <p className="label-eyebrow mb-2">Module {mod.position} · Lesson {lessonIndex + 1}</p>
        <h1 className="font-serif text-3xl lg:text-4xl mb-3">{lesson.title}</h1>
        {lesson.estimated_minutes && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-ink-muted">
            <Clock className="h-3.5 w-3.5" />
            <span>{lesson.estimated_minutes} min read</span>
          </div>
        )}
      </header>

      {lesson.body ? (
        <div className="prose prose-sm max-w-none text-ink prose-headings:font-serif prose-headings:text-ink prose-a:text-primary prose-strong:text-ink prose-code:text-ink prose-pre:bg-paper-dim prose-table:text-sm prose-th:text-ink prose-td:text-ink-muted">
          <ReactMarkdown>{lesson.body}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-sm text-ink-muted italic">Lesson content is not yet available.</p>
      )}

      {lessonResources.length > 0 && (
        <div className="mt-10 border-t border-rule pt-6">
          <h2 className="font-serif text-xl mb-4">Further reading</h2>
          <ul className="space-y-2">
            {lessonResources.map((r) => (
              <li key={r.id}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  {r.title}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <nav className="mt-10 pt-6 border-t border-rule flex items-center justify-between gap-4">
        {prevLesson ? (
          <Link
            to={`/modules/${mod.slug}/${prevLesson.slug}`}
            className="flex items-center gap-1.5 text-xs font-mono text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {prevLesson.title}
          </Link>
        ) : (
          <span />
        )}
        {nextLesson && (
          <Link
            to={`/modules/${mod.slug}/${nextLesson.slug}`}
            className="flex items-center gap-1.5 text-xs font-mono text-ink-muted hover:text-ink transition-colors ml-auto"
          >
            {nextLesson.title}
            <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
          </Link>
        )}
      </nav>
    </div>
  );
}
