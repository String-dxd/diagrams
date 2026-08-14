import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Next.js Link needs a router — next/jest sets this up automatically

describe('Index page', () => {
  it('renders the page heading', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /diagram tools/i })).toBeInTheDocument()
  })

  it('shows a card for Circuit Diagrams (Pri)', () => {
    render(<Home />)
    expect(screen.getByText('Circuit Diagrams (Pri)')).toBeInTheDocument()
  })

  it('shows a card for Circuit Diagrams (Sec/JC)', () => {
    render(<Home />)
    expect(screen.getByText('Circuit Diagrams (Sec/JC)')).toBeInTheDocument()
  })

  it('shows a card for Water Tank Diagram Generator', () => {
    render(<Home />)
    expect(screen.getByText('Water Tank Diagram Generator')).toBeInTheDocument()
  })

  it('shows a card for Isometric Cube Builder', () => {
    render(<Home />)
    expect(screen.getByText('Isometric Cube Builder')).toBeInTheDocument()
  })

  it('shows a card for Seed Dispersal Diagram', () => {
    render(<Home />)
    expect(screen.getByText('Seed Dispersal Diagram')).toBeInTheDocument()
  })

  it('links Pri circuit card to /tools/circuits', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /circuit diagrams \(pri\)/i })
    expect(link).toHaveAttribute('href', '/tools/circuits')
  })

  it('links Sec/JC circuit card to /tools/circuits-secjc', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /circuit diagrams \(sec\/jc\)/i })
    expect(link).toHaveAttribute('href', '/tools/circuits-secjc')
  })

  it('links water tank card to /tools/water-tank', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /water tank diagram generator/i })
    expect(link).toHaveAttribute('href', '/tools/water-tank')
  })

  it('links cube card to /tools/isometric-cube', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /isometric cube builder/i })
    expect(link).toHaveAttribute('href', '/tools/isometric-cube')
  })

  it('links seed dispersal card to /tools/seed-dispersal', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /seed dispersal diagram/i })
    expect(link).toHaveAttribute('href', '/tools/seed-dispersal')
  })

  it('shows the footer with creator credit', () => {
    render(<Home />)
    const footer = screen.getByRole('contentinfo')
    const link = screen.getByRole('link', { name: 'string.sg' })

    expect(footer).toHaveTextContent('Created by Julienne, supported by string.sg')
    expect(link).toHaveAttribute('href', 'https://string.sg')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
