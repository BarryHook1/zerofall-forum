import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const items = [
  {
    title: "Forum Is The Source Of Truth",
    copy: "Billing, status, ranks, badges, decay, reactivation, logs, and Discord sync all originate here.",
  },
  {
    title: "Sequential UID",
    copy: "UIDs are generated only after paid entry confirmation and are never recycled.",
  },
  {
    title: "Private Billing Surface",
    copy: "Recurring membership is visible only after entry and only inside the private area.",
  },
  {
    title: "Operational Staff Controls",
    copy: "Staff can inspect state, revoke accounts, reactivate members, update ranks, and replay Discord sync.",
  },
];

export function FeatureGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Card key={item.title}>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription className="mt-3">{item.copy}</CardDescription>
        </Card>
      ))}
    </section>
  );
}
