import { permanentRedirect } from 'next/navigation'

export default function BlogIndexPage() {
  permanentRedirect('/#blog')
}
