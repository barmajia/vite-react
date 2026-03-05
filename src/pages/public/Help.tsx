import { Link } from 'react-router-dom';
import { HelpCircle, Package, CreditCard, RotateCcw, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/lib/constants';

export function Help() {
  const faqs = [
    {
      icon: <Package className="h-6 w-6" />,
      title: 'Orders & Shipping',
      questions: [
        { q: 'How do I track my order?', a: 'You can track your order from your Orders page. Click on any order to see detailed tracking information.' },
        { q: 'How long does shipping take?', a: 'Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business days delivery.' },
        { q: 'Do you ship internationally?', a: 'Yes, we ship to most countries worldwide. International shipping times vary by destination.' },
      ],
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: 'Payment',
      questions: [
        { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and other secure payment methods.' },
        { q: 'Is my payment information secure?', a: 'Yes, all payments are processed through secure, encrypted connections.' },
        { q: 'Can I pay in installments?', a: 'Yes, we offer installment plans through our payment partners for eligible purchases.' },
      ],
    },
    {
      icon: <RotateCcw className="h-6 w-6" />,
      title: 'Returns & Refunds',
      questions: [
        { q: 'What is your return policy?', a: 'We offer a 30-day return policy for most items. Products must be in original condition.' },
        { q: 'How do I return an item?', a: 'Go to your Orders page, select the item, and click "Return Item". Follow the instructions to print a return label.' },
        { q: 'When will I receive my refund?', a: 'Refunds are processed within 5-7 business days after we receive your return.' },
      ],
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'Account & Support',
      questions: [
        { q: 'How do I contact customer support?', a: 'You can reach us via email, phone, or the messaging system in your account.' },
        { q: 'Can I change my email address?', a: 'Yes, go to Settings > Account to update your email address.' },
        { q: 'How do I delete my account?', a: 'Contact our support team to request account deletion. Note that this action is permanent.' },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12">
      <div className="text-center space-y-4 mb-12">
        <HelpCircle className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-4xl font-bold">Help Center</h1>
        <p className="text-xl text-muted-foreground">
          Find answers to common questions and get support
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <Link to={`${ROUTES.HELP}?topic=orders`} className="p-4 border rounded-lg hover:bg-accent transition-colors">
          <Package className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold">Orders</h3>
          <p className="text-sm text-muted-foreground">Track & manage orders</p>
        </Link>
        <Link to={`${ROUTES.HELP}?topic=payment`} className="p-4 border rounded-lg hover:bg-accent transition-colors">
          <CreditCard className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold">Payment</h3>
          <p className="text-sm text-muted-foreground">Billing & payments</p>
        </Link>
        <Link to={`${ROUTES.HELP}?topic=returns`} className="p-4 border rounded-lg hover:bg-accent transition-colors">
          <RotateCcw className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold">Returns</h3>
          <p className="text-sm text-muted-foreground">Returns & refunds</p>
        </Link>
        <Link to={`${ROUTES.CONTACT}`} className="p-4 border rounded-lg hover:bg-accent transition-colors">
          <MessageSquare className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold">Contact</h3>
          <p className="text-sm text-muted-foreground">Get in touch</p>
        </Link>
      </div>

      {/* FAQs */}
      <div className="space-y-8">
        {faqs.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {section.icon}
                <CardTitle>{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.questions.map((faq, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-medium">{faq.q}</h4>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Still Need Help */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
        <p className="text-muted-foreground mb-6">
          Our support team is here to assist you with any questions.
        </p>
        <div className="flex justify-center gap-4">
          <Link to={ROUTES.CONTACT}>
            Contact Support
          </Link>
          <Link to={`${ROUTES.MESSAGES}`}>
            Start a Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
