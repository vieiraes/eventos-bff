export interface User {
  id: string
  email: string
  full_name: string
  role: 'superadmin' | 'organizer' | 'staff' | 'attendee' | 'speaker' | 'vip'
  instance_id: string | null
  instance_name?: string
  avatar_url?: string
  phone?: string
  company?: string
  position?: string
  status: 'active' | 'inactive' | 'blocked'
}

export interface Instance {
  id: string
  name: string
  slug: string
  type: 'standard' | 'premium' | 'enterprise'
  status: 'active' | 'suspended' | 'cancelled'
  max_events?: number
  settings?: Record<string, any>
  created_at: string
}

export interface Event {
  id: string
  instance_id: string
  name: string
  slug: string
  description?: string
  event_type: 'conference' | 'workshop' | 'seminar' | 'congress' | 'fair'
  start_date: string
  end_date: string
  venue_name: string
  venue_city?: string
  venue_state?: string
  capacity?: number
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
  banner_url?: string
  logo_url?: string
}

export interface Registration {
  id: string
  event_id: string
  user_id: string
  registration_code?: string
  status: 'pre_registered' | 'awaiting_payment' | 'paid' | 'confirmed' | 'cancelled' | 'expired'
  badge_name?: string
  ticket_type?: string
  total_amount: number
  currency: string
  registered_at: string
  paid_at?: string
  confirmed_at?: string
}

export interface AccessPackage {
  id: string
  event_id: string
  name: string
  description?: string
  package_type: 'base' | 'addon' | 'premium' | 'vip'
  allowed_areas: string[]
  price: number
  currency: string
  available_quantity?: number
  status: 'active' | 'inactive' | 'sold_out'
}

export interface EventArea {
  id: string
  event_id: string
  name: string
  code?: string
  description?: string
  area_type: 'room' | 'hall' | 'stands' | 'vip_lounge' | 'entrance' | 'backstage'
  capacity?: number
  floor?: string
  status: 'active' | 'inactive' | 'maintenance'
}

export interface UserAccess {
  package_name: string
  package_type: string
  allowed_areas: string[]
  acquired_type: 'purchased' | 'complimentary' | 'upgraded' | 'sponsor'
  valid_from: string
  valid_until?: string
  status: 'active' | 'expired' | 'revoked'
}
