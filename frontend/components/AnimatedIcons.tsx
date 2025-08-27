'use client'
import { motion } from 'framer-motion'
import { 
  User, 
  Crown, 
  Star, 
  Trophy, 
  Target, 
  Zap, 
  TrendingUp, 
  BarChart3,
  Calendar,
  Clock,
  Phone,
  Globe,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ChevronRight,
  ArrowRight,
  Gift,
  Lock,
  Unlock,
  Shield,
  Award,
  Medal,
  Fire,
  Heart,
  Sparkles,
  Rocket,
  Diamond,
  Gem,
  Lightning,
  Sun,
  Moon,
  Cloud,
  Leaf,
  Flower,
  Tree,
  Mountain,
  Wave,
  Flame,
  Star2,
  Sparkle,
  Zap2,
  Thunder,
  Rainbow,
  Butterfly,
  Bird,
  Fish,
  Cat,
  Dog,
  Lion,
  Tiger,
  Bear,
  Wolf,
  Fox,
  Deer,
  Horse,
  Cow,
  Pig,
  Sheep,
  Goat,
  Chicken,
  Duck,
  Goose,
  Swan,
  Eagle,
  Hawk,
  Owl,
  Raven,
  Crow,
  Sparrow,
  Robin,
  Bluebird,
  Cardinal,
  Goldfinch,
  Canary,
  Parrot,
  Macaw,
  Cockatoo,
  Lovebird,
  Budgie,
  Finch,
  Warbler,
  Thrush,
  Mockingbird,
  Jay,
  Magpie,
  Nuthatch,
  Woodpecker,
  Kingfisher,
  Heron,
  Crane,
  Stork,
  Pelican,
  Albatross,
  Seagull,
  Tern,
  Sandpiper,
  Plover,
  Curlew,
  Godwit,
  Snipe,
  Woodcock,
  Sanderling,
  Dunlin,
  Knot,
  Turnstone,
  Oystercatcher,
  Avocet,
  Stilt,
  Phalarope,
  Skua,
  Jaeger,
  Gull,
  Tern2,
  Noddy,
  Tropicbird,
  Frigatebird,
  Booby,
  Gannet,
  Cormorant,
  Shag,
  Anhinga,
  Darter,
  Grebe,
  Loon,
  Auk,
  Murre,
  Guillemot,
  Razorbill,
  Puffin,
  Dovekie,
  StormPetrel,
  LeachPetrel,
  WilsonPetrel,
  WhiteTailedTropicbird,
  RedTailedTropicbird,
  RedBilledTropicbird,
  WhiteTailedTropicbird2,
  RedTailedTropicbird2,
  RedBilledTropicbird2
} from 'lucide-react'

interface AnimatedIconProps {
  icon: string
  size?: number
  className?: string
  animate?: boolean
  color?: string
}

export default function AnimatedIcon({ 
  icon, 
  size = 24, 
  className = "", 
  animate = true,
  color = "currentColor"
}: AnimatedIconProps) {
  const iconMap: { [key: string]: any } = {
    // Icônes de base
    user: User,
    crown: Crown,
    star: Star,
    trophy: Trophy,
    target: Target,
    zap: Zap,
    trendingUp: TrendingUp,
    barChart: BarChart3,
    calendar: Calendar,
    clock: Clock,
    phone: Phone,
    globe: Globe,
    settings: Settings,
    bell: Bell,
    check: CheckCircle,
    x: XCircle,
    alert: AlertCircle,
    info: Info,
    chevronRight: ChevronRight,
    arrowRight: ArrowRight,
    gift: Gift,
    lock: Lock,
    unlock: Unlock,
    shield: Shield,
    award: Award,
    medal: Medal,
    fire: Fire,
    heart: Heart,
    sparkles: Sparkles,
    rocket: Rocket,
    diamond: Diamond,
    gem: Gem,
    lightning: Lightning,
    sun: Sun,
    moon: Moon,
    cloud: Cloud,
    leaf: Leaf,
    flower: Flower,
    tree: Tree,
    mountain: Mountain,
    wave: Wave,
    flame: Flame,
    star2: Star2,
    sparkle: Sparkle,
    zap2: Zap2,
    thunder: Thunder,
    rainbow: Rainbow,
    butterfly: Butterfly,
    
    // Icônes d'animaux
    bird: Bird,
    fish: Fish,
    cat: Cat,
    dog: Dog,
    lion: Lion,
    tiger: Tiger,
    bear: Bear,
    wolf: Wolf,
    fox: Fox,
    deer: Deer,
    horse: Horse,
    cow: Cow,
    pig: Pig,
    sheep: Sheep,
    goat: Goat,
    chicken: Chicken,
    duck: Duck,
    goose: Goose,
    swan: Swan,
    eagle: Eagle,
    hawk: Hawk,
    owl: Owl,
    raven: Raven,
    crow: Crow,
    sparrow: Sparrow,
    robin: Robin,
    bluebird: Bluebird,
    cardinal: Cardinal,
    goldfinch: Goldfinch,
    canary: Canary,
    parrot: Parrot,
    macaw: Macaw,
    cockatoo: Cockatoo,
    lovebird: Lovebird,
    budgie: Budgie,
    finch: Finch,
    warbler: Warbler,
    thrush: Thrush,
    mockingbird: Mockingbird,
    jay: Jay,
    magpie: Magpie,
    nuthatch: Nuthatch,
    woodpecker: Woodpecker,
    kingfisher: Kingfisher,
    heron: Heron,
    crane: Crane,
    stork: Stork,
    pelican: Pelican,
    albatross: Albatross,
    seagull: Seagull,
    tern: Tern,
    sandpiper: Sandpiper,
    plover: Plover,
    curlew: Curlew,
    godwit: Godwit,
    snipe: Snipe,
    woodcock: Woodcock,
    sanderling: Sanderling,
    dunlin: Dunlin,
    knot: Knot,
    turnstone: Turnstone,
    oystercatcher: Oystercatcher,
    avocet: Avocet,
    stilt: Stilt,
    phalarope: Phalarope,
    skua: Skua,
    jaeger: Jaeger,
    gull: Gull,
    tern2: Tern2,
    noddy: Noddy,
    tropicbird: Tropicbird,
    frigatebird: Frigatebird,
    booby: Booby,
    gannet: Gannet,
    cormorant: Cormorant,
    shag: Shag,
    anhinga: Anhinga,
    darter: Darter,
    grebe: Grebe,
    loon: Loon,
    auk: Auk,
    murre: Murre,
    guillemot: Guillemot,
    razorbill: Razorbill,
    puffin: Puffin,
    dovekie: Dovekie,
    stormPetrel: StormPetrel,
    leachPetrel: LeachPetrel,
    wilsonPetrel: WilsonPetrel,
    whiteTailedTropicbird: WhiteTailedTropicbird,
    redTailedTropicbird: RedTailedTropicbird,
    redBilledTropicbird: RedBilledTropicbird,
    whiteTailedTropicbird2: WhiteTailedTropicbird2,
    redTailedTropicbird2: RedTailedTropicbird2,
    redBilledTropicbird2: RedBilledTropicbird2
  }

  const IconComponent = iconMap[icon] || User

  if (!animate) {
    return <IconComponent size={size} className={className} color={color} />
  }

  return (
    <motion.div
      whileHover={{ 
        scale: 1.1, 
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <IconComponent size={size} className={className} color={color} />
    </motion.div>
  )
}

// Composants d'icônes spécialisées avec animations
export function AnimatedCrown({ size = 24, className = "" }) {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.2, 
        rotateY: 180,
        transition: { duration: 0.5 }
      }}
      animate={{ 
        y: [0, -5, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Crown size={size} className={className} />
    </motion.div>
  )
}

export function AnimatedStar({ size = 24, className = "" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.3 }}
      animate={{ 
        rotate: [0, 360],
        scale: [1, 1.2, 1]
      }}
      transition={{ 
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Star size={size} className={className} />
    </motion.div>
  )
}

export function AnimatedTrophy({ size = 24, className = "" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.2 }}
      animate={{ 
        y: [0, -3, 0],
        rotate: [0, 2, -2, 0]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Trophy size={size} className={className} />
    </motion.div>
  )
}

export function AnimatedRocket({ size = 24, className = "" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.3 }}
      animate={{ 
        x: [0, 10, 0],
        y: [0, -5, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Rocket size={size} className={className} />
    </motion.div>
  )
}

export function AnimatedSparkles({ size = 24, className = "" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.4 }}
      animate={{ 
        rotate: [0, 180, 360],
        scale: [1, 1.3, 1]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Sparkles size={size} className={className} />
    </motion.div>
  )
} 