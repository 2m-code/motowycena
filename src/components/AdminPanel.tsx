import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { LogOut, Plus, Save, Upload, Trash2 } from 'lucide-react';
import styled from 'styled-components';
import {
  DEFAULT_SITE_CONTENT,
  imgUrl,
  type OfferSectionContent,
  type SiteContent,
  type Trailer,
} from '../data/siteContent';

type OfferKey = 'camping' | 'transport';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const cloneContent = (content: SiteContent): SiteContent => structuredClone(content);

const emptyTrailer = (): Trailer => ({
  id: Date.now(),
  name: 'Nowa pozycja',
  priceShort: '',
  description: '',
  images: [],
});

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function AdminPanel() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [uploading, setUploading] = useState('');

  useEffect(() => {
    fetch('/api/admin/session')
      .then((res) => {
        if (!res.ok) throw new Error('not_logged_in');
        return res.json();
      })
      .then(() => {
        setIsAuthed(true);
        return fetch('/api/admin/content');
      })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('content_fetch_failed'))))
      .then((data: SiteContent) => setContent(data))
      .catch(() => setIsAuthed(false))
      .finally(() => setIsCheckingSession(false));
  }, []);

  const patchContent = (updater: (draft: SiteContent) => void) => {
    setContent((prev) => {
      const draft = cloneContent(prev);
      updater(draft);
      return draft;
    });
    setSaveState('idle');
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setLoginError('Nieprawidłowe hasło.');
      return;
    }

    setIsAuthed(true);
    setPassword('');
    const contentRes = await fetch('/api/admin/content');
    if (contentRes.ok) setContent(await contentRes.json());
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthed(false);
  };

  const handleSave = async () => {
    setSaveState('saving');
    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });

    setSaveState(res.ok ? 'saved' : 'error');
  };

  const uploadImage = async (
    file: File,
    target:
      | { type: 'hero' }
      | { type: 'trailer'; section: OfferKey; trailerIndex: number }
  ) => {
    const uploadKey = target.type === 'hero' ? 'hero' : `${target.section}-${target.trailerIndex}`;
    setUploading(uploadKey);

    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, dataUrl }),
      });
      if (!res.ok) throw new Error('upload_failed');
      const data = (await res.json()) as { path: string };

      patchContent((draft) => {
        if (target.type === 'hero') {
          draft.hero.image = data.path;
        } else {
          draft[target.section].trailers[target.trailerIndex].images.push(data.path);
        }
      });
    } finally {
      setUploading('');
    }
  };

  if (isCheckingSession) {
    return <AdminShell>Ładowanie panelu...</AdminShell>;
  }

  if (!isAuthed) {
    return (
      <LoginShell>
        <LoginCard onSubmit={handleLogin}>
          <LoginTitle>Panel admina</LoginTitle>
          <LoginLead>Wpisz hasło, aby edytować treści strony.</LoginLead>
          <Label htmlFor="admin-password">Hasło</Label>
          <Input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          {loginError && <ErrorText>{loginError}</ErrorText>}
          <LoginSubmitRow>
            <PrimaryButton type="submit">Zaloguj</PrimaryButton>
          </LoginSubmitRow>
        </LoginCard>
      </LoginShell>
    );
  }

  return (
    <AdminShell>
      <TopBar>
        <div>
          <Eyebrow>Panel admina</Eyebrow>
          <PageTitle>Edycja treści strony</PageTitle>
        </div>
        <TopActions>
          <SecondaryButton type="button" onClick={handleLogout}>
            <LogOut size={18} />
            Wyloguj
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleSave} disabled={saveState === 'saving'}>
            <Save size={18} />
            {saveState === 'saving' ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </PrimaryButton>
        </TopActions>
      </TopBar>

      {saveState === 'saved' && <SuccessBanner>Zmiany zapisane. Strona publiczna pobierze je od razu.</SuccessBanner>}
      {saveState === 'error' && <ErrorBanner>Nie udało się zapisać zmian.</ErrorBanner>}

      <Grid>
        <Panel>
          <PanelTitle>Hero</PanelTitle>
          <FieldGrid>
            <TextField
              label="Etykieta"
              value={content.hero.kicker}
              onChange={(value) => patchContent((draft) => { draft.hero.kicker = value; })}
            />
            <TextField
              label="Nagłówek - pierwsza linia"
              value={content.hero.titlePrefix}
              onChange={(value) => patchContent((draft) => { draft.hero.titlePrefix = value; })}
            />
            <TextField
              label="Nagłówek - wyróżnienie"
              value={content.hero.titleAccent}
              onChange={(value) => patchContent((draft) => { draft.hero.titleAccent = value; })}
            />
            <TextField
              label="Tekst przycisku głównego"
              value={content.hero.primaryCta}
              onChange={(value) => patchContent((draft) => { draft.hero.primaryCta = value; })}
            />
            <TextField
              label="Tekst przycisku kontaktowego"
              value={content.hero.secondaryCta}
              onChange={(value) => patchContent((draft) => { draft.hero.secondaryCta = value; })}
            />
          </FieldGrid>
          <TextareaField
            label="Opis"
            value={content.hero.subtitle}
            rows={3}
            onChange={(value) => patchContent((draft) => { draft.hero.subtitle = value; })}
          />
          <ImageRow>
            {content.hero.image && (
              <ImageTile>
                <PreviewImage src={imgUrl(content.hero.image)} alt="" />
                <RemoveImageButton
                  type="button"
                  aria-label="Usuń zdjęcie główne"
                  onClick={() => patchContent((draft) => { draft.hero.image = ''; })}
                >
                  ×
                </RemoveImageButton>
              </ImageTile>
            )}
            <FileButton>
              <Upload size={18} />
              {uploading === 'hero' ? 'Wgrywanie...' : 'Zmień zdjęcie główne'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage(file, { type: 'hero' });
                }}
              />
            </FileButton>
          </ImageRow>
        </Panel>

        <Panel>
          <PanelTitle>Szybkie wyróżniki</PanelTitle>
          {content.highlights.map((highlight, index) => (
            <div key={index}>
              <TextField
                label={`Wyróżnik ${index + 1}`}
                value={highlight}
                onChange={(value) => patchContent((draft) => { draft.highlights[index] = value; })}
              />
            </div>
          ))}
        </Panel>

        <OfferEditor
          title="Oferta kempingowa"
          sectionKey="camping"
          section={content.camping}
          uploading={uploading}
          patchContent={patchContent}
          uploadImage={uploadImage}
        />

        <OfferEditor
          title="Oferta transportowa"
          sectionKey="transport"
          section={content.transport}
          uploading={uploading}
          patchContent={patchContent}
          uploadImage={uploadImage}
        />

        <Panel>
          <PanelTitle>Kontakt</PanelTitle>
          <FieldGrid>
            <TextField
              label="Etykieta"
              value={content.contact.kicker}
              onChange={(value) => patchContent((draft) => { draft.contact.kicker = value; })}
            />
            <TextField
              label="Telefon"
              value={content.contact.phone}
              onChange={(value) => patchContent((draft) => { draft.contact.phone = value; })}
            />
            <TextField
              label="E-mail"
              value={content.contact.email}
              onChange={(value) => patchContent((draft) => { draft.contact.email = value; })}
            />
            <TextField
              label="Adres"
              value={content.contact.address}
              onChange={(value) => patchContent((draft) => { draft.contact.address = value; })}
            />
          </FieldGrid>
          <TextareaField
            label="Nagłówek"
            value={content.contact.title}
            rows={2}
            onChange={(value) => patchContent((draft) => { draft.contact.title = value; })}
          />
          <TextareaField
            label="Opis"
            value={content.contact.lead}
            rows={3}
            onChange={(value) => patchContent((draft) => { draft.contact.lead = value; })}
          />
        </Panel>

        <Panel>
          <PanelTitle>Dokumenty</PanelTitle>
          <TextField
            label="Tytuł polityki prywatności"
            value={content.legal.privacy.title}
            onChange={(value) => patchContent((draft) => { draft.legal.privacy.title = value; })}
          />
          <TextField
            label="Data aktualizacji polityki"
            value={content.legal.privacy.updatedAt}
            onChange={(value) => patchContent((draft) => { draft.legal.privacy.updatedAt = value; })}
          />
          <TextareaField
            label="Polityka prywatności"
            value={content.legal.privacy.body}
            rows={12}
            onChange={(value) => patchContent((draft) => { draft.legal.privacy.body = value; })}
          />
          <Divider />
          <TextField
            label="Tytuł regulaminu"
            value={content.legal.terms.title}
            onChange={(value) => patchContent((draft) => { draft.legal.terms.title = value; })}
          />
          <TextField
            label="Data aktualizacji regulaminu"
            value={content.legal.terms.updatedAt}
            onChange={(value) => patchContent((draft) => { draft.legal.terms.updatedAt = value; })}
          />
          <TextareaField
            label="Regulamin"
            value={content.legal.terms.body}
            rows={10}
            onChange={(value) => patchContent((draft) => { draft.legal.terms.body = value; })}
          />
        </Panel>
      </Grid>
    </AdminShell>
  );
}

function OfferEditor({
  title,
  sectionKey,
  section,
  uploading,
  patchContent,
  uploadImage,
}: {
  title: string;
  sectionKey: OfferKey;
  section: OfferSectionContent;
  uploading: string;
  patchContent: (updater: (draft: SiteContent) => void) => void;
  uploadImage: (
    file: File,
    target: { type: 'trailer'; section: OfferKey; trailerIndex: number }
  ) => Promise<void>;
}) {
  const moveImage = (trailerIndex: number, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    patchContent((draft) => {
      const images = draft[sectionKey].trailers[trailerIndex].images;
      const [moved] = images.splice(fromIndex, 1);
      if (!moved) return;
      images.splice(toIndex, 0, moved);
    });
  };

  const handleImageDragStart = (
    event: DragEvent<HTMLDivElement>,
    trailerIndex: number,
    imageIndex: number
  ) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({ sectionKey, trailerIndex, imageIndex })
    );
  };

  const handleImageDrop = (
    event: DragEvent<HTMLDivElement>,
    trailerIndex: number,
    targetIndex: number
  ) => {
    event.preventDefault();

    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json')) as {
        sectionKey?: OfferKey;
        trailerIndex?: number;
        imageIndex?: number;
      };

      if (
        data.sectionKey !== sectionKey ||
        data.trailerIndex !== trailerIndex ||
        typeof data.imageIndex !== 'number'
      ) {
        return;
      }

      moveImage(trailerIndex, data.imageIndex, targetIndex);
    } catch {
      return;
    }
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
        <SecondaryButton
          type="button"
          onClick={() => patchContent((draft) => { draft[sectionKey].trailers.push(emptyTrailer()); })}
        >
          <Plus size={18} />
          Dodaj pozycję
        </SecondaryButton>
      </PanelHeader>

      <FieldGrid>
        <TextField
          label="Etykieta"
          value={section.kicker}
          onChange={(value) => patchContent((draft) => { draft[sectionKey].kicker = value; })}
        />
        <TextField
          label="Nagłówek"
          value={section.title}
          onChange={(value) => patchContent((draft) => { draft[sectionKey].title = value; })}
        />
        <TextField
          label="Napis na plakietce"
          value={section.badge}
          onChange={(value) => patchContent((draft) => { draft[sectionKey].badge = value; })}
        />
        <TextField
          label="Kolor plakietki"
          value={section.badgeColor}
          onChange={(value) => patchContent((draft) => { draft[sectionKey].badgeColor = value; })}
        />
      </FieldGrid>

      <TextareaField
        label="Opis sekcji"
        value={section.lead}
        rows={3}
        onChange={(value) => patchContent((draft) => { draft[sectionKey].lead = value; })}
      />

      <TrailerStack>
        {section.trailers.map((trailer, trailerIndex) => (
          <TrailerEditor key={trailer.id}>
            <TrailerHeader>
              <StrongTitle>{trailer.name || `Pozycja ${trailerIndex + 1}`}</StrongTitle>
              <IconButton
                type="button"
                aria-label="Usuń pozycję"
                onClick={() => patchContent((draft) => {
                  draft[sectionKey].trailers.splice(trailerIndex, 1);
                })}
              >
                <Trash2 size={18} />
              </IconButton>
            </TrailerHeader>
            <FieldGrid>
              <TextField
                label="Nazwa"
                value={trailer.name}
                onChange={(value) => patchContent((draft) => {
                  draft[sectionKey].trailers[trailerIndex].name = value;
                })}
              />
              <TextField
                label="Cena"
                value={trailer.priceShort}
                onChange={(value) => patchContent((draft) => {
                  draft[sectionKey].trailers[trailerIndex].priceShort = value;
                })}
              />
            </FieldGrid>
            <TextareaField
              label="Opis"
              value={trailer.description}
              rows={8}
              onChange={(value) => patchContent((draft) => {
                draft[sectionKey].trailers[trailerIndex].description = value;
              })}
            />
            <TextareaField
              label="Zdjęcia (po jednej ścieżce w linii)"
              value={trailer.images.join('\n')}
              rows={4}
              onChange={(value) => patchContent((draft) => {
                draft[sectionKey].trailers[trailerIndex].images = value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean);
              })}
            />
            <ImageStrip>
              {trailer.images.map((image, imageIndex) => (
                <ImageTile
                  key={`${image}-${imageIndex}`}
                  draggable
                  title="Przeciągnij, aby zmienić kolejność"
                  onDragStart={(event) => handleImageDragStart(event, trailerIndex, imageIndex)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(event) => handleImageDrop(event, trailerIndex, imageIndex)}
                >
                  <PreviewImage src={imgUrl(image)} alt="" />
                  <RemoveImageButton
                    type="button"
                    aria-label={`Usuń zdjęcie ${image}`}
                    onClick={() => patchContent((draft) => {
                      draft[sectionKey].trailers[trailerIndex].images.splice(imageIndex, 1);
                    })}
                  >
                    ×
                  </RemoveImageButton>
                </ImageTile>
              ))}
              <FileButton>
                <Upload size={18} />
                {uploading === `${sectionKey}-${trailerIndex}` ? 'Wgrywanie...' : 'Dodaj zdjęcie'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(file, {
                      type: 'trailer',
                      section: sectionKey,
                      trailerIndex,
                    });
                  }}
                />
              </FileButton>
            </ImageStrip>
          </TrailerEditor>
        ))}
      </TrailerStack>
    </Panel>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function TextareaField({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <Label>{label}</Label>
      <Textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

const AdminShell = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  padding: 2rem;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
`;

const LoginShell = styled(AdminShell)`
  display: grid;
  place-items: center;
`;

const LoginCard = styled.form`
  width: min(100%, 28rem);
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
`;

const LoginSubmitRow = styled.div`
  margin-top: 0.75rem;
`;

const LoginTitle = styled.h1`
  font-size: 1.75rem;
  margin: 0 0 0.5rem;
`;

const LoginLead = styled.p`
  margin: 0 0 1.5rem;
  color: #64748b;
`;

const TopBar = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 auto 1.5rem;
  max-width: 82rem;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const TopActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Eyebrow = styled.div`
  color: #0066ff;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const PageTitle = styled.h1`
  margin: 0.25rem 0 0;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  max-width: 82rem;
  margin: 0 auto;
`;

const Panel = styled.section`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const PanelTitle = styled.h2`
  margin: 0 0 1rem;
  font-size: 1.2rem;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.4rem;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const Input = styled.input`
  width: 100%;
  min-height: 2.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.75rem;
  color: #0f172a;
  font: inherit;

  &:focus {
    border-color: #0066ff;
    outline: 3px solid rgba(0, 102, 255, 0.14);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.75rem;
  color: #0f172a;
  font: inherit;
  resize: vertical;

  &:focus {
    border-color: #0066ff;
    outline: 3px solid rgba(0, 102, 255, 0.14);
  }
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  border: 0;
  border-radius: 8px;
  padding: 0 1rem;
  background: #0066ff;
  color: #ffffff;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 1rem;
  background: #ffffff;
  color: #0f172a;
  font-weight: 800;
  cursor: pointer;
`;

const IconButton = styled(SecondaryButton)`
  width: 2.5rem;
  min-height: 2.5rem;
  padding: 0;
`;

const FileButton = styled.label`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 1rem;
  background: #ffffff;
  color: #0f172a;
  font-weight: 800;
  cursor: pointer;

  input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
`;

const ImageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ImageStrip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ImageTile = styled.div`
  position: relative;
  width: 7rem;
  height: 5rem;
  flex: 0 0 auto;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const PreviewImage = styled.img`
  width: 7rem;
  height: 5rem;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.55rem;
  height: 1.55rem;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.82);
  color: #ffffff;
  font-size: 1.1rem;
  line-height: 1;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.22);

  &:hover {
    background: #dc2626;
  }
`;

const TrailerStack = styled.div`
  display: grid;
  gap: 1rem;
`;

const TrailerEditor = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background: #f8fafc;
`;

const TrailerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const StrongTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const Divider = styled.hr`
  border: 0;
  border-top: 1px solid #e2e8f0;
  margin: 1.5rem 0;
`;

const SuccessBanner = styled.div`
  max-width: 82rem;
  margin: 0 auto 1rem;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  background: #dcfce7;
  color: #14532d;
  font-weight: 700;
`;

const ErrorBanner = styled(SuccessBanner)`
  background: #fee2e2;
  color: #7f1d1d;
`;

const ErrorText = styled.p`
  color: #b91c1c;
  margin: -0.5rem 0 1rem;
  font-weight: 700;
`;
