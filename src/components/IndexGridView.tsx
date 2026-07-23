'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Pin, Check, MapPin, Sparkles, Filter, X, Maximize2, FileText, ChevronDown } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { Applicant } from '@/lib/data';
import { PdfModal } from './PdfModal';
import { ArtistDetailModal } from './ArtistDetailModal';
import { getAllScores, getCompositeScore, getJudgeName, ScoreRecord } from '@/lib/scoreManager';

interface IndexGridViewProps {
  applicants: Applicant[];
}

export function IndexGridView({ applicants }: IndexGridViewProps) {
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'unscored' | 'scored'>('all');
  const [sortBy, setSortBy] = useState<'unscored_first' | 'score_high_low' | 'score_low_high' | 'name' | 'room'>('unscored_first');

  // Load localStorage filters on mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('toff_judge_filters');
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        if (parsed.selectedRoom) setSelectedRoom(parsed.selectedRoom);
        if (parsed.reviewStatusFilter) setReviewStatusFilter(parsed.reviewStatusFilter);
        if (parsed.sortBy) setSortBy(parsed.sortBy);
      }
    } catch (e) {}
  }, []);

  // Save localStorage filters on change
  useEffect(() => {
    localStorage.setItem('toff_judge_filters', JSON.stringify({
      selectedRoom,
      reviewStatusFilter,
      sortBy
    }));
  }, [selectedRoom, reviewStatusFilter, sortBy]);

  // Active Artist Detail Modal
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Sync URL query param ?artist=slug & handle open event
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const artistParam = params.get('artist');
    if (artistParam) {
      setSelectedSlug(artistParam);
    }

    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.slug) {
        openArtistModal(customEvent.detail.slug);
      }
    };

    window.addEventListener('toff_open_artist_modal', handleCustomOpen);
    return () => window.removeEventListener('toff_open_artist_modal', handleCustomOpen);
  }, []);

  const openArtistModal = (slug: string) => {
    setSelectedSlug(slug);
    const judge = getJudgeName();
    const judgeQuery = judge ? `&judge=${encodeURIComponent(judge)}` : '';
    window.history.pushState(null, '', `/2026?artist=${slug}${judgeQuery}`);
  };

  const closeArtistModal = () => {
    setSelectedSlug(null);
    const judge = getJudgeName();
    const judgeQuery = judge ? `?judge=${encodeURIComponent(judge)}` : '';
    window.history.pushState(null, '', `/2026${judgeQuery}`);
  };

  // Active PDF for Full Screen Modal Popup
  const [activePdf, setActivePdf] = useState<{ title: string; url: string } | null>(null);

  const [artistScores, setArtistScores] = useState<Record<string, ScoreRecord>>({});
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>([]);

  // Load localStorage states
  useEffect(() => {
    const updateLocalStates = () => {
      const allScores = getAllScores();
      const scoreMap: Record<string, ScoreRecord> = {};
      allScores.forEach(s => scoreMap[s.slug] = s);
      setArtistScores(scoreMap);

      const pinnedRaw = localStorage.getItem('pinned_slugs');
      if (pinnedRaw) {
        try {
          const parsed = JSON.parse(pinnedRaw);
          if (Array.isArray(parsed)) setPinnedSlugs(parsed);
        } catch (e) {}
      }
    };

    updateLocalStates();
    window.addEventListener('toff_score_updated', updateLocalStates);
    window.addEventListener('toff_pinned_change', updateLocalStates);
    window.addEventListener('storage', updateLocalStates);

    return () => {
      window.removeEventListener('toff_score_updated', updateLocalStates);
      window.removeEventListener('toff_pinned_change', updateLocalStates);
      window.removeEventListener('storage', updateLocalStates);
    };
  }, []);

  const togglePin = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let updated: string[];
    if (pinnedSlugs.includes(slug)) {
      updated = pinnedSlugs.filter(s => s !== slug);
    } else {
      if (pinnedSlugs.length >= 3) {
        alert('You can pin up to 3 artists to compare side-by-side.');
        return;
      }
      updated = [...pinnedSlugs, slug];
    }
    setPinnedSlugs(updated);
    localStorage.setItem('pinned_slugs', JSON.stringify(updated));
    window.dispatchEvent(new Event('toff_pinned_change'));
  };

  // Derive unique options for filters
  const roomOptions = useMemo(() => {
    const set = new Set<string>();
    applicants.forEach(a => {
      a.roomRequests?.forEach(r => {
        if (r.room) set.add(r.room);
      });
    });
    return Array.from(set).sort();
  }, [applicants]);

  const getStableHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  };

  // Filtering & Sorting
  const filteredApplicants = useMemo(() => {
    const judgeName = typeof window !== 'undefined' ? (localStorage.getItem('judge_name') || 'Anonymous') : 'Anonymous';

    return applicants
      .filter(a => {
        // Text search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = a.fullName.toLowerCase().includes(q);
          const matchMedium = a.medium.toLowerCase().includes(q);
          const matchBio = a.bio.toLowerCase().includes(q);
          const matchCity = a.city.toLowerCase().includes(q);
          const matchCountry = a.country.toLowerCase().includes(q);
          if (!matchName && !matchMedium && !matchBio && !matchCity && !matchCountry) {
            return false;
          }
        }

        // Room filter
        if (selectedRoom !== 'all') {
          const hasRoom = a.roomRequests?.some(r => r.room === selectedRoom);
          if (!hasRoom) return false;
        }

        // Review Status filter
        const isScored = !!artistScores[a.slug];
        if (reviewStatusFilter === 'unscored' && isScored) return false;
        if (reviewStatusFilter === 'scored' && !isScored) return false;

        return true;
      })
      .sort((a, b) => {
        const scoreA = artistScores[a.slug];
        const scoreB = artistScores[b.slug];
        const isScoredA = !!scoreA;
        const isScoredB = !!scoreB;
        
        if (sortBy === 'unscored_first') {
          if (isScoredA !== isScoredB) return isScoredA ? 1 : -1; // Unscored first
          if (!isScoredA && !isScoredB) {
            const hashA = getStableHash(judgeName + a.slug);
            const hashB = getStableHash(judgeName + b.slug);
            return hashA - hashB;
          }
          return a.lastName.localeCompare(b.lastName);
        }
        else if (sortBy === 'score_high_low') {
          if (isScoredA !== isScoredB) return isScoredA ? -1 : 1; // Scored first
          if (isScoredA && isScoredB) {
            return getCompositeScore(scoreB) - getCompositeScore(scoreA);
          }
          return a.lastName.localeCompare(b.lastName);
        }
        else if (sortBy === 'score_low_high') {
          if (isScoredA !== isScoredB) return isScoredA ? -1 : 1; // Scored first
          if (isScoredA && isScoredB) {
            return getCompositeScore(scoreA) - getCompositeScore(scoreB);
          }
          return a.lastName.localeCompare(b.lastName);
        }
        else if (sortBy === 'name') {
          return a.lastName.localeCompare(b.lastName);
        }
        else if (sortBy === 'room') {
          const roomA = a.roomRequests?.[0]?.room || 'ZZZ';
          const roomB = b.roomRequests?.[0]?.room || 'ZZZ';
          return roomA.localeCompare(roomB);
        }
        return 0;
      });
  }, [applicants, search, selectedRoom, reviewStatusFilter, sortBy, artistScores]);

  // Compute active artist for Modal Overlay
  const selectedArtistIndex = useMemo(() => {
    if (!selectedSlug) return -1;
    return filteredApplicants.findIndex(a => a.slug === selectedSlug);
  }, [filteredApplicants, selectedSlug]);

  const selectedArtist = selectedArtistIndex >= 0 ? filteredApplicants[selectedArtistIndex] : null;
  const modalPrevSlug = selectedArtistIndex > 0 ? filteredApplicants[selectedArtistIndex - 1].slug : null;
  const modalNextSlug = selectedArtistIndex >= 0 && selectedArtistIndex < filteredApplicants.length - 1 ? filteredApplicants[selectedArtistIndex + 1].slug : null;

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Controls Bar */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by artist, medium, location, or bio..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.6rem',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Room Filter */}
          <div style={{ flex: '0 0 auto' }}>
            <Select.Root value={selectedRoom} onValueChange={setSelectedRoom}>
              <Select.Trigger 
                style={{
                  padding: '0.65rem 1rem',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  minWidth: '150px'
                }}
              >
                <Select.Value placeholder="All Rooms" />
                <Select.Icon><ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /></Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content 
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    zIndex: 2000
                  }}
                  position="popper"
                  sideOffset={4}
                >
                  <Select.Viewport style={{ padding: '0.25rem' }}>
                    <Select.Item value="all" style={{ padding: '0.5rem 1rem', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor='var(--bg-main)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor='transparent'}>
                      <Select.ItemText>All Rooms</Select.ItemText>
                    </Select.Item>
                    {roomOptions.map(room => (
                      <Select.Item key={room} value={room} style={{ padding: '0.5rem 1rem', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor='var(--bg-main)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor='transparent'}>
                        <Select.ItemText>{room}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Review Status Filter (Segmented Control) */}
          <ToggleGroup.Root 
            type="single"
            value={reviewStatusFilter}
            onValueChange={(value) => {
              if (value) setReviewStatusFilter(value as any);
            }}
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            {(['all', 'unscored', 'scored'] as const).map((status) => (
              <ToggleGroup.Item
                key={status}
                value={status}
                style={{
                  padding: '0.65rem 1rem',
                  border: 'none',
                  background: reviewStatusFilter === status ? 'var(--accent-muted)' : 'transparent',
                  color: reviewStatusFilter === status ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: reviewStatusFilter === status ? 600 : 400,
                  textTransform: 'capitalize',
                  fontSize: '0.85rem',
                }}
              >
                {status}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>

          {/* Sort By */}
          <div style={{ flex: '0 0 auto', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="label-utility" style={{ fontSize: '10px' }}>Sort:</span>
            <Select.Root value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <Select.Trigger 
                style={{
                  padding: '0.65rem 1rem',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  minWidth: '220px'
                }}
              >
                <Select.Value />
                <Select.Icon><ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /></Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content 
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    zIndex: 2000
                  }}
                  position="popper"
                  sideOffset={4}
                >
                  <Select.Viewport style={{ padding: '0.25rem' }}>
                    <Select.Item value="unscored_first" style={{ padding: '0.5rem 1rem', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor='var(--bg-main)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor='transparent'}><Select.ItemText>Unscored First (Default)</Select.ItemText></Select.Item>
                    <Select.Item value="score_high_low" style={{ padding: '0.5rem 1rem', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor='var(--bg-main)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor='transparent'}><Select.ItemText>My Score: High → Low</Select.ItemText></Select.Item>
                    <Select.Item value="score_low_high" style={{ padding: '0.5rem 1rem', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor='var(--bg-main)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor='transparent'}><Select.ItemText>My Score: Low → High</Select.ItemText></Select.Item>
                    <Select.Item value="name" style={{ padding: '0.5rem 1rem', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor='var(--bg-main)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor='transparent'}><Select.ItemText>Name (A–Z)</Select.ItemText></Select.Item>
                    <Select.Item value="room" style={{ padding: '0.5rem 1rem', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor='var(--bg-main)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor='transparent'}><Select.ItemText>Room / Term</Select.ItemText></Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>
            Showing <strong>{filteredApplicants.length}</strong> of {applicants.length}
            {' | '}
            {reviewStatusFilter === 'all' ? 'All Applicants' : reviewStatusFilter === 'unscored' ? 'Unscored' : 'Scored'}
            {selectedRoom !== 'all' && ` · ${selectedRoom}`}
          </span>
          {(search || selectedRoom !== 'all' || reviewStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedRoom('all');
                setReviewStatusFilter('all');
                setSortBy('unscored_first');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Masonry Grid */}
      {filteredApplicants.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px dashed var(--border-strong)',
        }}>
          <p className="font-display" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            No applicants match the selected criteria
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Try adjusting your search keywords or clearing active filters.
          </p>
        </div>
      ) : (
        <div className="masonry-grid">
          {filteredApplicants.map((artist) => {
            const scoreRecord = artistScores[artist.slug];
            const isPinned = pinnedSlugs.includes(artist.slug);
            
            // Find the first actual image work sample
            const heroImageSample = artist.workSamples?.find(s => {
              if (s.isImage !== undefined) return s.isImage;
              const ext = s.web.split('?')[0].split('.').pop()?.toLowerCase();
              return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'].includes(ext || '');
            });

            // Find first non-image document sample if no image exists
            const firstDocSample = artist.workSamples?.find(s => !s.isImage);

            return (
              <div key={artist.slug} className="masonry-item">
                <div
                  onClick={() => openArtistModal(artist.slug)}
                  style={{
                    display: 'block',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px',
                    border: isPinned ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  {/* Pin Button */}
                  <button
                    onClick={(e) => togglePin(artist.slug, e)}
                    title={isPinned ? 'Unpin from Compare' : 'Pin to Compare'}
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      zIndex: 10,
                      backgroundColor: isPinned ? 'var(--accent)' : 'rgba(20, 18, 16, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: isPinned ? '#FFF' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Pin size={14} style={{ transform: isPinned ? 'rotate(-45deg)' : 'none' }} />
                  </button>

                  {/* Composite Score Badge */}
                  {scoreRecord && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      zIndex: 10,
                      backgroundColor: 'var(--bg-elevated)',
                      backdropFilter: 'blur(4px)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '20px',
                      padding: '0.25rem 0.6rem',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}>
                      <Check size={13} style={{ color: '#4CAF50' }} />
                      {getCompositeScore(scoreRecord).toFixed(1)}
                    </div>
                  )}

                  {/* Hero Artwork Image or PDF Viewer / Typographic Placeholder */}
                  {heroImageSample ? (
                    <div style={{ width: '100%', backgroundColor: '#0D0C0A', maxHeight: '450px', overflow: 'hidden' }}>
                      <img
                        src={heroImageSample.web}
                        alt={heroImageSample.name || artist.fullName}
                        loading="lazy"
                        style={{
                          width: '100%',
                          maxHeight: '450px',
                          display: 'block',
                          objectFit: 'cover',
                          objectPosition: 'top'
                        }}
                      />
                    </div>
                  ) : firstDocSample ? (
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActivePdf({ title: `${artist.fullName} - ${firstDocSample.name}`, url: firstDocSample.original });
                      }}
                      style={{
                        width: '100%',
                        height: '260px',
                        backgroundColor: '#191714',
                        overflow: 'hidden',
                        position: 'relative',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <iframe
                        src={`${firstDocSample.original}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        title={firstDocSample.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          pointerEvents: 'none',
                          backgroundColor: '#FFF',
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'rgba(20, 18, 16, 0.88)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: '4px',
                        padding: '0.3rem 0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#FFF',
                        zIndex: 10,
                        backdropFilter: 'blur(4px)',
                        pointerEvents: 'none',
                      }}>
                        <Maximize2 size={12} />
                        Full Screen
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      height: '240px',
                      backgroundColor: '#191714',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2rem',
                      textAlign: 'center',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}>
                      <Sparkles size={24} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                      <h3 className="font-display" style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                        {artist.fullName}
                      </h3>
                      <p className="label-utility" style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                        No work sample files
                      </p>
                    </div>
                  )}

                  {/* Caption Band */}
                  <div style={{ padding: '1.25rem' }}>
                    <div className="label-utility" style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span>{artist.medium || 'Visual Art'}</span>
                      {(artist.city || artist.country) && (
                        <>
                          <span>·</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <MapPin size={11} />
                            {[artist.city, artist.country].filter(Boolean).join(', ')}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.6rem', lineHeight: 1.25 }}>
                      {artist.fullName}
                    </h2>

                    {/* Room Chips */}
                    {artist.roomRequests && artist.roomRequests.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                        {artist.roomRequests.map((req, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '11px',
                              backgroundColor: 'var(--bg-main)',
                              border: '1px solid var(--border-subtle)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {req.room} {req.price ? `(${req.price})` : ''} {req.term ? `— ${req.term}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Screen PDF Modal */}
      <PdfModal
        isOpen={!!activePdf}
        onClose={() => setActivePdf(null)}
        title={activePdf?.title || 'PDF Document'}
        pdfUrl={activePdf?.url || ''}
      />

      {/* Artist Detail Modal Overlay */}
      <ArtistDetailModal
        isOpen={!!selectedSlug}
        onClose={closeArtistModal}
        applicant={selectedArtist}
        prevSlug={modalPrevSlug}
        nextSlug={modalNextSlug}
        onNavigate={(slug) => openArtistModal(slug)}
      />
    </div>
  );
}
